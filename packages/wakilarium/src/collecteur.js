// Wakilarium — le collecteur local : reçoit les Wakil Events, les range, les sert au composant. Node seul, aucune
// dépendance, écoute sur 127.0.0.1 uniquement. Rien n'est exécuté, rien n'est appelé vers l'extérieur (spec §8).
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { Magasin, etat, PAR_APPEL_MAX } from './magasin.js';
import { etatPublic } from './public.js';
import { badgeSvg } from './badge.js';

const ICI = dirname(fileURLToPath(import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.ndjson': 'application/x-ndjson; charset=utf-8' };

export function jetonPublic(dossier) {
  const f = join(dossier, 'config.json');
  let cfg = {};
  try { if (existsSync(f)) cfg = JSON.parse(readFileSync(f, 'utf8')) || {}; } catch { cfg = {}; }
  if (!cfg.jeton_public) {
    cfg.jeton_public = randomBytes(12).toString('hex');
    try { mkdirSync(dossier, { recursive: true }); writeFileSync(f, JSON.stringify(cfg, null, 2) + '\n'); } catch { /* sans disque, le jeton vit le temps du processus */ }
  }
  return cfg.jeton_public;
}

function json(res, code, corps, entetes = {}) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...entetes });
  res.end(JSON.stringify(corps));
}

function lireCorps(req, max = 2 * 1024 * 1024) {
  return new Promise((resoudre, rejeter) => {
    const morceaux = []; let taille = 0;
    req.on('data', (m) => { taille += m.length; if (taille > max) { rejeter(new Error('corps trop grand')); req.destroy(); } else morceaux.push(m); });
    req.on('end', () => resoudre(Buffer.concat(morceaux).toString('utf8')));
    req.on('error', rejeter);
  });
}

/** Décode un corps : tableau JSON, objet JSON, ou NDJSON. */
export function decoder(texte) {
  const t = (texte || '').trim();
  if (!t) return [];
  if (t[0] === '[') return JSON.parse(t);
  if (t[0] === '{' && !t.includes('\n')) return [JSON.parse(t)];
  return t.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l));
}

const CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'";

/**
 * Crée le serveur. `options.magasin` injectable (tests) ; `options.statique` : dossier des fichiers servis (page, composant).
 */
export function creerServeur(options = {}) {
  const magasin = options.magasin || new Magasin({ dossier: options.dossier });
  const dossier = options.dossier || magasin.dossier;
  const statique = options.statique || ICI;
  const jeton = options.jeton || jetonPublic(dossier);
  const lang = options.lang || 'fr';
  const flux = new Set();
  magasin.abonner((nouveaux) => { const ligne = `data: ${JSON.stringify(nouveaux)}\n\n`; for (const res of flux) { try { res.write(ligne); } catch { flux.delete(res); } } });

  const serveur = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const chemin = url.pathname;
    try {
      if (req.method === 'POST' && chemin === '/events') {
        let liste;
        try { liste = decoder(await lireCorps(req)); } catch (e) { return json(res, 400, { error: 'corps illisible', detail: String(e.message) }); }
        if (!Array.isArray(liste)) return json(res, 400, { error: 'tableau ou NDJSON attendu' });
        if (liste.length > PAR_APPEL_MAX) return json(res, 413, { error: `au plus ${PAR_APPEL_MAX} événements par appel` });
        const r = magasin.ajouter(liste);
        return json(res, r.acceptes ? 202 : 422, { accepted: r.acceptes, rejected: r.refuses });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'méthode' });
      if (chemin === '/state') return json(res, 200, etat(magasin, url.searchParams.get('hours') || 24));
      if (chemin === '/stream') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
        res.write(': wakilarium\n\n'); flux.add(res); req.on('close', () => flux.delete(res)); return;
      }
      if (chemin === `/public/${jeton}` || chemin === `/public/${jeton}/state`) return json(res, 200, etatPublic(etat(magasin, url.searchParams.get('hours') || 24), lang));
      if (chemin === `/public/${jeton}/export.wakil` || chemin === '/export.wakil') {
        const publique = chemin !== '/export.wakil';
        const e = publique ? etatPublic(etat(magasin, 24 * 7), lang).events : etat(magasin, 24 * 7).events;
        res.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8', 'content-disposition': 'attachment; filename="journee.wakil"' });
        return res.end(e.map((x) => JSON.stringify(x)).join('\n') + '\n');
      }
      if (chemin === '/badge.svg' || chemin === `/public/${jeton}/badge.svg`) {
        res.writeHead(200, { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(badgeSvg(etatPublic(etat(magasin, 24), lang), { theme: url.searchParams.get('theme') || 'night' }));
      }
      if (chemin === '/healthz') return json(res, 200, { ok: true, events: magasin.evenements.length });
      if (chemin === '/jeton') return json(res, 200, { public_url: `/public/${jeton}`, badge_url: `/badge.svg` });
      const fichiers = { '/': 'page.html', '/index.html': 'page.html', '/wakilarium.js': 'wakilarium.js', '/page.js': 'page.js', '/public.js': 'public.js' };
      if (chemin.startsWith('/public/') && (chemin.endsWith('/') || chemin === `/public/${jeton}/page`)) { fichiers[chemin] = 'page.html'; }
      const nom = fichiers[chemin];
      if (nom) {
        const f = join(statique, nom);
        if (!existsSync(f)) return json(res, 404, { error: 'absent' });
        const ext = nom.slice(nom.lastIndexOf('.'));
        res.writeHead(200, { 'content-type': TYPES[ext] || 'application/octet-stream', 'content-security-policy': CSP, 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'no-store' });
        return res.end(readFileSync(f));
      }
      return json(res, 404, { error: 'inconnu' });
    } catch (e) {
      return json(res, 500, { error: 'interne', detail: String(e && e.message) });
    }
  });
  serveur.magasin = magasin;
  serveur.jeton = jeton;
  return serveur;
}

/** Rejoue la journée de démonstration (maquette) décalée sur aujourd'hui, dans le magasin donné. */
export function chargerDemo(magasin, fichier = join(ICI, 'demo.ndjson'), maintenant = Date.now()) {
  const lignes = readFileSync(fichier, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l));
  if (!lignes.length) return 0;
  const t0 = Date.parse(lignes[0].ts), tn = Date.parse(lignes[lignes.length - 1].ts);
  const decalage = maintenant - tn;                       // la dernière carte arrive maintenant, la première ce matin
  const decales = lignes.map((e) => ({ ...e, ts: new Date(Date.parse(e.ts) + decalage).toISOString(), source: 'demo' }));
  void t0;
  return magasin.ajouter(decales).acceptes;
}
