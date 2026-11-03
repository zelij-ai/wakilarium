// Wakilarium — le magasin : les événements en mémoire (anneau borné) et sur disque (NDJSON ajouté, jamais réécrit).
// Rien ne quitte la machine : le fichier vit dans ~/.wakilarium, lu au démarrage sur la fenêtre utile.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const KINDS = ['run.start', 'run.end', 'tool', 'message', 'decision.open', 'decision.made', 'visitor', 'launch', 'cost', 'note'];
export const STATUTS = ['ok', 'running', 'failed', 'approved', 'refused', 'changes', 'pending'];
export const TAILLE_MAX = 16 * 1024;       // un événement (spec §2)
export const PAR_APPEL_MAX = 1000;         // événements par POST (spec §5)
export const RENDUS_MAX = 300;             // événements rendus par fenêtre (spec §5)
export const FENETRE_MAX_H = 24 * 7;       // 7 jours au plus (spec §5)

export function dossierMaison() {
  return process.env.WAKILARIUM_HOME || join(homedir(), '.wakilarium');
}

/** Valide et normalise un événement ; rend {ok, evenement} ou {ok:false, erreur}. Les champs inconnus sont conservés. */
export function valider(brut) {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return { ok: false, erreur: 'objet attendu' };
  const texte = JSON.stringify(brut);
  if (Buffer.byteLength(texte) > TAILLE_MAX) return { ok: false, erreur: 'événement de plus de 16 Ko' };
  const e = { ...brut };
  if (e.v !== '0.1') return { ok: false, erreur: 'v doit valoir "0.1"' };
  const ts = Date.parse(e.ts);
  if (!e.ts || Number.isNaN(ts)) return { ok: false, erreur: 'ts ISO 8601 attendu' };
  if (!KINDS.includes(e.kind)) return { ok: false, erreur: 'kind inconnu' };
  if (!e.actor || typeof e.actor !== 'object' || !e.actor.id) return { ok: false, erreur: 'actor.id obligatoire' };
  if (typeof e.title !== 'string' || !e.title.trim()) return { ok: false, erreur: 'title obligatoire' };
  e.title = e.title.slice(0, 140);
  if (e.public_title != null) e.public_title = String(e.public_title).slice(0, 140);
  if (e.detail != null) e.detail = String(e.detail).slice(0, 2000);
  if (e.status != null && !STATUTS.includes(e.status)) delete e.status;
  if (e.target && (typeof e.target !== 'object' || !e.target.id)) delete e.target;
  if (e.cost && (typeof e.cost !== 'object' || typeof e.cost.amount !== 'number')) delete e.cost;
  if (!e.id) e.id = randomUUID();
  return { ok: true, evenement: e };
}

export class Magasin {
  /** @param {{dossier?: string, memoireMax?: number, persister?: boolean}} options */
  constructor(options = {}) {
    this.dossier = options.dossier || dossierMaison();
    this.fichier = join(this.dossier, 'events.ndjson');
    this.memoireMax = options.memoireMax || 20000;
    this.persister = options.persister !== false;
    this.evenements = [];
    this.abonnes = new Set();
    if (this.persister) this.charger();
  }

  charger() {
    if (!existsSync(this.fichier)) return 0;
    const depuis = Date.now() - FENETRE_MAX_H * 3600 * 1000;
    const lignes = readFileSync(this.fichier, 'utf8').split('\n');
    let n = 0;
    for (const l of lignes) {
      if (!l.trim()) continue;
      try {
        const e = JSON.parse(l);
        if (Date.parse(e.ts) >= depuis) { this.evenements.push(e); n++; }
      } catch { /* ligne abîmée : ignorée */ }
    }
    this.evenements.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
    if (this.evenements.length > this.memoireMax) this.evenements = this.evenements.slice(-this.memoireMax);
    return n;
  }

  /** Ajoute une liste de bruts ; rend {acceptes, refuses: [{index, erreur}]}. */
  ajouter(bruts) {
    const liste = Array.isArray(bruts) ? bruts.slice(0, PAR_APPEL_MAX) : [bruts];
    const refuses = [], acceptes = [];
    liste.forEach((b, i) => {
      const r = valider(b);
      if (!r.ok) { refuses.push({ index: i, erreur: r.erreur }); return; }
      acceptes.push(r.evenement);
    });
    if (acceptes.length) {
      this.evenements.push(...acceptes);
      this.evenements.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
      if (this.evenements.length > this.memoireMax) this.evenements.splice(0, this.evenements.length - this.memoireMax);
      if (this.persister) {
        try { mkdirSync(this.dossier, { recursive: true }); appendFileSync(this.fichier, acceptes.map((e) => JSON.stringify(e)).join('\n') + '\n'); } catch { /* disque indisponible : la mémoire suffit */ }
      }
      for (const f of this.abonnes) { try { f(acceptes); } catch { /* un abonné cassé n'arrête pas les autres */ } }
    }
    return { acceptes: acceptes.length, refuses };
  }

  /** Les événements de la fenêtre (heures), les plus récents d'abord bornés à RENDUS_MAX, rendus en ordre chronologique. */
  fenetre(heures = 24, maintenant = Date.now()) {
    const h = Math.max(1, Math.min(FENETRE_MAX_H, Number(heures) || 24));
    const depuis = maintenant - h * 3600 * 1000;
    const dedans = this.evenements.filter((e) => { const t = Date.parse(e.ts); return t >= depuis && t <= maintenant + 60000; });
    return { heures: h, depuis, evenements: dedans.slice(-RENDUS_MAX) };
  }

  abonner(f) { this.abonnes.add(f); return () => this.abonnes.delete(f); }
}

/** L'état servi par GET /state (spec §5) : fenêtre, couloirs, acteurs, événements, totaux. */
export function etat(magasin, heures = 24, maintenant = Date.now()) {
  const { heures: h, depuis, evenements } = magasin.fenetre(heures, maintenant);
  // Les acteurs se décrivent souvent une seule fois (premier événement) : leur fiche se lit sur toute la mémoire, la
  // fenêtre ne décide que de qui apparaît.
  const connus = {};
  const noter = (a) => {
    if (!a || !a.id) return;
    const ex = connus[a.id] || (connus[a.id] = { id: a.id, kind: 'agent' });
    for (const k of ['name', 'role', 'lane', 'kind', 'avatar']) if (a[k]) ex[k] = a[k];
  };
  for (const e of magasin.evenements) { noter(e.actor); noter(e.target); }
  const presents = new Set();
  for (const e of evenements) { if (e.actor && e.actor.id) presents.add(e.actor.id); if (e.target && e.target.id) presents.add(e.target.id); }
  const acteurs = {}, lanes = [];
  for (const id of presents) {
    const ex = { ...(connus[id] || { id, kind: 'agent' }) };
    if (ex.kind === 'human') ex.lane = ex.lane || 'direction';
    if (ex.kind === 'visitor') ex.lane = 'entree';
    ex.lane = ex.lane || 'autres';
    acteurs[id] = ex;
    if (!lanes.includes(ex.lane)) lanes.push(ex.lane);
  }
  if (lanes.includes('entree')) { lanes.splice(lanes.indexOf('entree'), 1); lanes.push('entree'); }
  let cost = 0, runs = 0, pending = 0;
  for (const e of evenements) {
    if (e.cost && typeof e.cost.amount === 'number') cost += e.cost.amount;
    if (e.kind === 'run.start') runs++;
    if (e.kind === 'decision.open') pending++;
    if (e.kind === 'decision.made') pending = Math.max(0, pending - 1);
  }
  return {
    window: { hours: h, from: new Date(depuis).toISOString(), to: new Date(maintenant).toISOString() },
    lanes, actors: Object.values(acteurs), events: evenements,
    totals: { cost: Math.round(cost * 100) / 100, runs, pending_decisions: pending },
  };
}
