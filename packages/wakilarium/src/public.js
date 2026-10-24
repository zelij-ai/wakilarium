// Wakilarium — la vue publique : la même scène, sans aucun détail privé (spec §5 et §8).
// title := public_title ou libellé générique de la nature ; detail, attrs, cost disparaissent ; les coûts totaux aussi.
const GENERIQUE = {
  fr: { 'run.start': 'commence à travailler', 'run.end': 'a terminé', tool: 'utilise un outil', message: 'échange', 'decision.open': 'propose une décision',
        'decision.made': 'a décidé', visitor: 'un visiteur', launch: 'met en ligne', cost: '', note: 'note' },
  en: { 'run.start': 'starts working', 'run.end': 'is done', tool: 'uses a tool', message: 'exchanges', 'decision.open': 'proposes a decision',
        'decision.made': 'has decided', visitor: 'a visitor', launch: 'goes live', cost: '', note: 'note' },
};

export function libelleGenerique(kind, status, lang = 'fr') {
  const t = GENERIQUE[lang] || GENERIQUE.fr;
  if (kind === 'run.end' && status === 'failed') return lang === 'en' ? 'has failed' : 'a échoué';
  return t[kind] || '';
}

export function acteurPublic(a) {
  if (!a || !a.id) return a;
  const p = { id: a.id, kind: a.kind || 'agent' };
  for (const k of ['name', 'role', 'lane', 'avatar']) if (a[k]) p[k] = a[k];
  return p;
}

/** Un événement tel qu'une page publique peut l'afficher. null si rien ne doit sortir (coût isolé). */
export function evenementPublic(e, lang = 'fr') {
  if (!e || e.kind === 'cost') return null;
  const p = { v: e.v, id: e.id, ts: e.ts, kind: e.kind, actor: acteurPublic(e.actor), title: e.public_title || libelleGenerique(e.kind, e.status, lang) };
  if (e.target) p.target = acteurPublic(e.target);
  if (e.status) p.status = e.status;
  if (e.run_id) p.run_id = e.run_id;
  if (e.parent_id) p.parent_id = e.parent_id;
  return p;
}

/** L'état public (spec §5) : même forme que /state, titres publics seulement, aucun coût. */
export function etatPublic(etat, lang = 'fr') {
  return {
    window: etat.window,
    lanes: etat.lanes,
    actors: etat.actors.map(acteurPublic),
    events: etat.events.map((e) => evenementPublic(e, lang)).filter(Boolean),
    totals: { runs: etat.totals.runs, pending_decisions: etat.totals.pending_decisions },
    public: true,
  };
}
