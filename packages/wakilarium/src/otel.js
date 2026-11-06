// Wakilarium — l'adaptateur OpenTelemetry GenAI / OpenInference : des traces OTLP/HTTP (JSON) aux Wakil Events (spec §6.2).
// Pur et testable : `traduireTraces(requete)` rend une liste d'événements ; le collecteur l'expose sur POST /v1/traces.
// Un span `invoke_agent` devient run.start + run.end, un span `execute_tool` devient un `tool`, un span `chat` apporte les
// jetons et le modèle au coût de l'exécution qui l'englobe (montant d'après une table de tarifs datée, jamais inventé).
// Les contenus de prompts et de réponses ne sont jamais copiés : seuls les noms, les comptes et les statuts sont lus.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dossierMaison } from './magasin.js';

export const SOURCE = 'otel-genai';
export const LANE = 'otel';

/** Tarifs en dollars par million de jetons (entrée, sortie), relevés sur les pages de prix des éditeurs le 06/11/2026.
 *  Un modèle absent n'est jamais chiffré : ses jetons restent dans `attrs`, sans montant. Complétez ou corrigez la table
 *  dans ~/.wakilarium/tarifs.json : {"date": "AAAA-MM-JJ", "modeles": {"mon-modele": [entree, sortie]}}. */
export const TARIFS = {
  date: '2026-11-06',
  devise: 'USD',
  modeles: {
    'claude-opus-4-5': [5, 25], 'claude-opus-4-1': [15, 75], 'claude-opus-4': [15, 75],
    'claude-sonnet-4-5': [3, 15], 'claude-sonnet-4': [3, 15], 'claude-haiku-4-5': [1, 5], 'claude-3-5-haiku': [0.8, 4],
    'gpt-5': [1.25, 10], 'gpt-5-mini': [0.25, 2], 'gpt-5-nano': [0.05, 0.4],
    'gpt-4-1': [2, 8], 'gpt-4-1-mini': [0.4, 1.6], 'gpt-4-1-nano': [0.1, 0.4], 'gpt-4o': [2.5, 10], 'gpt-4o-mini': [0.15, 0.6],
    'gemini-2-5-pro': [1.25, 10], 'gemini-2-5-flash': [0.3, 2.5], 'gemini-2-5-flash-lite': [0.1, 0.4],
  },
};

const T = {
  fr: { execution: (n) => `Exécution de ${n}`, commence: 'commence à travailler', termine: 'a terminé', echoue: 'a échoué', outil: 'utilise un outil',
        jetons: (m, i, o) => `${m} · ${i} jetons entrés, ${o} sortis`, sansTarif: 'modèle sans tarif connu' },
  en: { execution: (n) => `Run of ${n}`, commence: 'starts working', termine: 'is done', echoue: 'has failed', outil: 'uses a tool',
        jetons: (m, i, o) => `${m} · ${i} tokens in, ${o} out`, sansTarif: 'model without a known price' },
};

function court(s, n) { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'agent'; }

/** Une valeur OTLP JSON ({stringValue}, {intValue:"3"}, {doubleValue}, {boolValue}, {arrayValue}) en valeur JavaScript. */
export function valeur(v) {
  if (v == null || typeof v !== 'object') return v;
  if ('stringValue' in v) return v.stringValue;
  if ('intValue' in v) return Number(v.intValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('boolValue' in v) return !!v.boolValue;
  if ('arrayValue' in v) return ((v.arrayValue && v.arrayValue.values) || []).map(valeur);
  if ('kvlistValue' in v) return attributs((v.kvlistValue && v.kvlistValue.values) || []);
  return undefined;
}

/** La liste d'attributs OTLP en objet plat {clé: valeur}. */
export function attributs(liste) {
  const o = {};
  for (const a of Array.isArray(liste) ? liste : []) if (a && a.key) o[a.key] = valeur(a.value);
  return o;
}

/** Nanosecondes depuis l'époque (nombre ou chaîne) en millisecondes ; 0 ou illisible → null. */
export function millis(nano) {
  if (nano == null || nano === '' || nano === 0 || nano === '0') return null;
  try { return Number(BigInt(String(nano)) / 1000000n); } catch { const n = Number(nano); return Number.isFinite(n) && n > 0 ? Math.floor(n / 1e6) : null; }
}

function iso(ms) { return new Date(ms).toISOString(); }

function statutSpan(status) {
  const code = status && status.code;
  if (code === 2 || code === 'STATUS_CODE_ERROR') return 'failed';
  return 'ok';
}

/** Nature d'un span pour la projection : agent, tool, llm ou null. */
export function nature(span, attrs) {
  const op = String(attrs['gen_ai.operation.name'] || '').toLowerCase();
  const oi = String(attrs['openinference.span.kind'] || '').toUpperCase();
  const nom = String(span.name || '').toLowerCase();
  if (op === 'invoke_agent' || oi === 'AGENT' || (!op && /^invoke_agent\b/.test(nom))) return 'agent';
  if (op === 'execute_tool' || oi === 'TOOL' || (!op && /^execute_tool\b/.test(nom))) return 'tool';
  if (['chat', 'generate_content', 'text_completion', 'embeddings'].includes(op) || oi === 'LLM' || (!op && /^(chat|generate_content|text_completion) /.test(nom))) return 'llm';
  return null;
}

/** Nom de modèle normalisé pour la table : minuscules, points et espaces en tirets, suffixe de date (-20250514, -2024-07-18) retiré. */
export function cleModele(modele) {
  return String(modele || '').toLowerCase().trim().replace(/@.*$/, '').replace(/[.\s_]+/g, '-').replace(/-\d{4}-?\d{2}-?\d{2}$/, '').replace(/-latest$/, '');
}

/** Lit ~/.wakilarium/tarifs.json s'il existe et le fond sur la table livrée ; sinon la table livrée. */
export function tarifs(dossier = dossierMaison()) {
  const f = join(dossier, 'tarifs.json');
  if (!existsSync(f)) return TARIFS;
  try {
    const perso = JSON.parse(readFileSync(f, 'utf8')) || {};
    return { date: perso.date || TARIFS.date, devise: perso.devise || TARIFS.devise, modeles: { ...TARIFS.modeles, ...(perso.modeles || {}) } };
  } catch { return TARIFS; }
}

/** Montant en devise de la table pour un modèle et des jetons, ou null si le modèle n'a pas de tarif. */
export function chiffrer(modele, entres, sortis, table = TARIFS) {
  const t = table.modeles[cleModele(modele)];
  if (!t) return null;
  return Math.round(((entres || 0) * t[0] + (sortis || 0) * t[1]) / 1e6 * 1e6) / 1e6;
}

/**
 * Traduit une requête OTLP/HTTP JSON (`ExportTraceServiceRequest`) en Wakil Events.
 * @param {object} requete  {resourceSpans: [{resource, scopeSpans: [{spans: [...]}]}]}
 * @param {{lang?: string, tarifs?: object, maintenant?: number}} options
 */
export function traduireTraces(requete, options = {}) {
  const lang = options.lang === 'en' ? 'en' : 'fr';
  const t = T[lang];
  const table = options.tarifs || TARIFS;
  const spans = [];
  for (const rs of (requete && requete.resourceSpans) || []) {
    const ressource = attributs(rs.resource && rs.resource.attributes);
    for (const ss of rs.scopeSpans || []) for (const s of ss.spans || []) if (s && s.spanId) spans.push({ span: s, attrs: attributs(s.attributes), ressource });
  }
  const parId = new Map(spans.map((x) => [x.span.spanId, x]));
  const acteurDe = (x) => {
    // L'acteur d'un span : son agent, sinon celui de l'ancêtre agent le plus proche du lot, sinon le service.
    let cur = x, garde = 0;
    while (cur && garde++ < 64) {
      const a = cur.attrs;
      if (a['gen_ai.agent.name'] || a['gen_ai.agent.id']) {
        const nom = String(a['gen_ai.agent.name'] || a['gen_ai.agent.id']);
        return { id: String(a['gen_ai.agent.id'] || slug(nom)), name: nom, role: court(a['gen_ai.agent.description'] || a['gen_ai.provider.name'] || a['gen_ai.system'] || '', 60) || undefined,
                 lane: String(cur.ressource['service.name'] || LANE), kind: 'agent' };
      }
      cur = cur.span.parentSpanId ? parId.get(cur.span.parentSpanId) : null;
    }
    const service = String(x.ressource['service.name'] || 'service');
    return { id: slug(service), name: service, role: 'OpenTelemetry', lane: String(x.ressource['service.name'] || LANE), kind: 'agent' };
  };
  const agentEnglobant = (x) => {
    let cur = x.span.parentSpanId ? parId.get(x.span.parentSpanId) : null, garde = 0;
    while (cur && garde++ < 64) { if (nature(cur.span, cur.attrs) === 'agent') return cur; cur = cur.span.parentSpanId ? parId.get(cur.span.parentSpanId) : null; }
    return null;
  };
  const provider = (x) => x.attrs['gen_ai.provider.name'] || x.attrs['gen_ai.system'] || undefined;

  // 1. Les coûts des spans de modèle, rattachés à l'exécution englobante quand il y en a une dans le lot.
  const couts = new Map();                       // spanId de l'agent → {entres, sortis, montant, modeles, sansTarif}
  const isoles = [];
  for (const x of spans) {
    if (nature(x.span, x.attrs) !== 'llm') continue;
    const a = x.attrs;
    const modele = String(a['gen_ai.response.model'] || a['gen_ai.request.model'] || '');
    const entres = Number(a['gen_ai.usage.input_tokens'] || a['llm.token_count.prompt'] || 0) || 0;
    const sortis = Number(a['gen_ai.usage.output_tokens'] || a['llm.token_count.completion'] || 0) || 0;
    const montant = chiffrer(modele, entres, sortis, table);
    const agent = agentEnglobant(x);
    if (agent) {
      const c = couts.get(agent.span.spanId) || couts.set(agent.span.spanId, { entres: 0, sortis: 0, montant: 0, modeles: new Set(), sansTarif: new Set() }).get(agent.span.spanId);
      c.entres += entres; c.sortis += sortis;
      if (montant == null) c.sansTarif.add(modele || '?'); else c.montant += montant;
      if (modele) c.modeles.add(modele);
    } else isoles.push({ x, modele, entres, sortis, montant });
  }

  const sortie = [];
  const base = (x) => ({ v: '0.1', source: SOURCE, run_id: x.span.traceId });
  for (const x of spans) {
    const n = nature(x.span, x.attrs);
    if (!n) continue;
    const debut = millis(x.span.startTimeUnixNano), fin = millis(x.span.endTimeUnixNano);
    if (debut == null) continue;
    const acteur = acteurDe(x);
    const statut = statutSpan(x.span.status);
    const message = x.span.status && x.span.status.message ? court(x.span.status.message, 300) : undefined;
    const attrs = { span: x.span.name };
    if (provider(x)) attrs.provider = String(provider(x));
    if (fin != null) attrs.duration_ms = Math.max(0, fin - debut);
    if (n === 'agent') {
      const nom = String(x.attrs['gen_ai.agent.name'] || acteur.name);
      const parent = x.span.parentSpanId ? { parent_id: x.span.parentSpanId } : {};
      sortie.push({ ...base(x), ...parent, id: `${x.span.spanId}:start`, ts: iso(debut), kind: 'run.start', actor: acteur, title: t.execution(nom), public_title: t.commence, status: 'running', attrs: { span: x.span.name, ...(attrs.provider ? { provider: attrs.provider } : {}) } });
      if (fin != null) {
        const c = couts.get(x.span.spanId);
        const e = { ...base(x), ...parent, id: `${x.span.spanId}:end`, ts: iso(fin), kind: 'run.end', actor: acteur, title: statut === 'failed' ? `${t.execution(nom)} : ${message || t.echoue}` : t.execution(nom),
                    public_title: statut === 'failed' ? t.echoue : t.termine, status: statut, attrs };
        if (message) e.detail = message;
        if (c) {
          const modeles = [...c.modeles];
          if (c.montant > 0 || c.sansTarif.size === 0) e.cost = { amount: Math.round(c.montant * 10000) / 10000, currency: table.devise || 'USD', tokens_in: c.entres, tokens_out: c.sortis, ...(modeles.length === 1 ? { model: modeles[0] } : {}) };
          e.attrs = { ...e.attrs, tokens_in: c.entres, tokens_out: c.sortis, models: modeles, ...(c.sansTarif.size ? { unpriced_models: [...c.sansTarif], tarifs: table.date } : {}) };
        }
        sortie.push(e);
      }
    } else if (n === 'tool') {
      const outil = String(x.attrs['gen_ai.tool.name'] || x.attrs['tool.name'] || x.span.name || 'tool');
      const e = { ...base(x), id: x.span.spanId, ts: iso(debut), kind: 'tool', actor: acteur, title: court(outil, 140), public_title: t.outil, status: fin == null ? 'running' : statut, attrs: { ...attrs, tool: outil } };
      if (x.span.parentSpanId) e.parent_id = x.span.parentSpanId;
      if (message) e.detail = message;
      sortie.push(e);
    }
  }
  for (const { x, modele, entres, sortis, montant } of isoles) {
    const fin = millis(x.span.endTimeUnixNano) ?? millis(x.span.startTimeUnixNano);
    if (fin == null) continue;
    const e = { ...base(x), id: x.span.spanId, ts: iso(fin), kind: 'cost', actor: acteurDe(x), title: court(t.jetons(modele || '?', entres, sortis), 140),
                attrs: { span: x.span.name, tokens_in: entres, tokens_out: sortis, model: modele || undefined, ...(provider(x) ? { provider: String(provider(x)) } : {}) } };
    if (x.span.parentSpanId) e.parent_id = x.span.parentSpanId;
    if (montant != null) e.cost = { amount: Math.round(montant * 10000) / 10000, currency: table.devise || 'USD', tokens_in: entres, tokens_out: sortis, model: modele };
    else { e.attrs.unpriced = true; e.attrs.tarifs = table.date; e.detail = t.sansTarif; }
    sortie.push(e);
  }
  sortie.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  return sortie;
}
