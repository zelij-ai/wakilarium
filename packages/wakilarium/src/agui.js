// Wakilarium — l'adaptateur AG-UI : le flux d'événements agent → interface devient des Wakil Events (spec §6.3).
// AG-UI est un flux (SSE ou NDJSON) de petits événements typés : un message arrive en START / CONTENT / END, un appel
// d'outil en START / ARGS / END / RESULT. Le traducteur garde donc un état par exécution et n'émet qu'aux frontières :
// RUN_STARTED → run.start, RUN_FINISHED / RUN_ERROR → run.end, TEXT_MESSAGE_END → un `message`, TOOL_CALL_START → un `tool`
// `running` que TOOL_CALL_RESULT met à jour (même identifiant) en `ok` ou `failed`, STEP_* → `note`. Les STATE_* et
// MESSAGES_SNAPSHOT sont ignorés : ce ne sont pas des faits à montrer. Les arguments des outils ne sont jamais copiés.

export const SOURCE = 'ag-ui';
export const LANE = 'ag-ui';
export const IGNORES = ['STATE_SNAPSHOT', 'STATE_DELTA', 'MESSAGES_SNAPSHOT', 'RAW', 'CUSTOM', 'TEXT_MESSAGE_CHUNK', 'TOOL_CALL_CHUNK', 'THINKING_START', 'THINKING_END', 'THINKING_TEXT_MESSAGE_START', 'THINKING_TEXT_MESSAGE_CONTENT', 'THINKING_TEXT_MESSAGE_END', 'ACTIVITY_SNAPSHOT', 'ACTIVITY_DELTA'];

const T = {
  fr: { commence: 'commence à travailler', termine: 'a terminé', echoue: 'a échoué', repond: 'répond', demande: 'une demande', outil: 'utilise un outil',
        execution: (id) => `Exécution ${id}`, etapeDebut: (n) => `Étape « ${n} » commencée`, etapeFin: (n) => `Étape « ${n} » terminée`, note: 'note', message: 'Message', erreur: 'Erreur' },
  en: { commence: 'starts working', termine: 'is done', echoue: 'has failed', repond: 'replies', demande: 'a request', outil: 'uses a tool',
        execution: (id) => `Run ${id}`, etapeDebut: (n) => `Step “${n}” started`, etapeFin: (n) => `Step “${n}” finished`, note: 'note', message: 'Message', erreur: 'Error' },
};

function court(s, n) { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

/** Décode un flux AG-UI reçu en texte : lignes SSE (`data: {...}`), NDJSON, tableau JSON ou objet JSON. */
export function decoderFlux(texte) {
  const t = String(texte || '').trim();
  if (!t) return [];
  if (t[0] === '[') return JSON.parse(t);
  const sortie = [];
  for (const brute of t.split('\n')) {
    let l = brute.trim();
    if (!l || l.startsWith(':') || l.startsWith('event:') || l.startsWith('id:') || l.startsWith('retry:')) continue;
    if (l.startsWith('data:')) l = l.slice(5).trim();
    if (!l.startsWith('{')) continue;
    try { sortie.push(JSON.parse(l)); } catch { /* ligne abîmée : ignorée */ }
  }
  return sortie;
}

/**
 * Traducteur avec état : une instance par source (le collecteur en garde une, la commande `wakilarium agui` une autre).
 * @param {{agent?: object, lang?: string, maintenant?: () => number}} options  `agent` : l'acteur à mettre en scène
 */
export class TraducteurAgui {
  constructor(options = {}) {
    this.lang = options.lang === 'en' ? 'en' : 'fr';
    this.t = T[this.lang];
    this.agent = { id: 'ag-ui', name: 'Agent', role: 'AG-UI', lane: LANE, kind: 'agent', ...(options.agent || {}) };
    this.humain = { id: 'vous', name: this.lang === 'en' ? 'You' : 'Vous', kind: 'human', lane: 'direction' };
    this.maintenant = options.maintenant || (() => Date.now());
    this.runs = new Map();        // runId → {threadId}
    this.messages = new Map();    // messageId → {role, texte, runId}
    this.outils = new Map();      // toolCallId → {nom, runId}
    this.runCourant = null;
  }

  ts(ev) { const n = Number(ev && ev.timestamp); return new Date(Number.isFinite(n) && n > 0 ? n : this.maintenant()).toISOString(); }

  base(ev, runId) { const b = { v: '0.1', ts: this.ts(ev), source: SOURCE }; if (runId) b.run_id = String(runId); return b; }

  /** Traduit un événement AG-UI en zéro ou un Wakil Event. */
  traduire(ev) {
    if (!ev || typeof ev !== 'object' || typeof ev.type !== 'string') return [];
    const type = ev.type.toUpperCase();
    const t = this.t;
    const runId = ev.runId ? String(ev.runId) : this.runCourant;
    switch (type) {
      case 'RUN_STARTED': {
        this.runCourant = runId;
        this.runs.set(runId, { threadId: ev.threadId ? String(ev.threadId) : undefined });
        const attrs = ev.threadId ? { thread: String(ev.threadId) } : undefined;
        return [{ ...this.base(ev, runId), id: `${runId}:start`, kind: 'run.start', actor: this.agent, title: t.execution(runId), public_title: t.commence, status: 'running', ...(attrs ? { attrs } : {}) }];
      }
      case 'RUN_FINISHED':
        this.runs.delete(runId); if (this.runCourant === runId) this.runCourant = null;
        return [{ ...this.base(ev, runId), id: `${runId}:end`, kind: 'run.end', actor: this.agent, title: t.execution(runId), public_title: t.termine, status: 'ok' }];
      case 'RUN_ERROR': {
        this.runs.delete(runId); if (this.runCourant === runId) this.runCourant = null;
        const message = court(ev.message || t.erreur, 300);
        return [{ ...this.base(ev, runId), id: `${runId}:end`, kind: 'run.end', actor: this.agent, title: court(`${t.execution(runId)} : ${message}`, 140), public_title: t.echoue, status: 'failed', detail: message,
                  ...(ev.code != null ? { attrs: { code: String(ev.code) } } : {}) }];
      }
      case 'STEP_STARTED':
        return [{ ...this.base(ev, runId), kind: 'note', actor: this.agent, title: court(t.etapeDebut(ev.stepName || '?'), 140), public_title: t.note, status: 'running' }];
      case 'STEP_FINISHED':
        return [{ ...this.base(ev, runId), kind: 'note', actor: this.agent, title: court(t.etapeFin(ev.stepName || '?'), 140), public_title: t.note, status: 'ok' }];
      case 'TEXT_MESSAGE_START':
        if (ev.messageId != null) this.messages.set(String(ev.messageId), { role: String(ev.role || 'assistant'), texte: '', runId });
        return [];
      case 'TEXT_MESSAGE_CONTENT': {
        const m = ev.messageId != null && this.messages.get(String(ev.messageId));
        if (m && m.texte.length < 2000) m.texte += String(ev.delta || '');
        return [];
      }
      case 'TEXT_MESSAGE_END': {
        const id = ev.messageId != null ? String(ev.messageId) : null;
        const m = (id && this.messages.get(id)) || { role: 'assistant', texte: '', runId };
        if (id) this.messages.delete(id);
        const humain = /^(user|human)$/i.test(m.role);
        const texte = m.texte.trim();
        const e = { ...this.base(ev, m.runId || runId), ...(id ? { id: `msg-${id}` } : {}), kind: 'message', actor: humain ? this.humain : this.agent, target: humain ? this.agent : this.humain,
                    title: court(texte, 140) || t.message, public_title: humain ? t.demande : t.repond, attrs: { role: m.role } };
        if (texte) e.detail = court(texte, 2000);
        return [e];
      }
      case 'TOOL_CALL_START': {
        const id = String(ev.toolCallId || `${runId || 'run'}-${this.outils.size + 1}`);
        const nom = String(ev.toolCallName || 'tool');
        this.outils.set(id, { nom, runId });
        const e = { ...this.base(ev, runId), id: `tool-${id}`, kind: 'tool', actor: this.agent, title: court(nom, 140), public_title: t.outil, status: 'running', attrs: { tool: nom } };
        if (ev.parentMessageId != null) e.parent_id = `msg-${ev.parentMessageId}`;
        return [e];
      }
      case 'TOOL_CALL_ARGS':
      case 'TOOL_CALL_END':
        return [];                                      // les arguments ne sont jamais copiés ; la fin attend le résultat
      case 'TOOL_CALL_RESULT': {
        const id = String(ev.toolCallId || '');
        const o = this.outils.get(id) || { nom: 'tool', runId };
        this.outils.delete(id);
        const contenu = typeof ev.content === 'string' ? ev.content : ev.content == null ? '' : JSON.stringify(ev.content);
        const rate = /^\s*(error|erreur)\b/i.test(contenu);
        const e = { ...this.base(ev, o.runId || runId), id: `tool-${id}`, kind: 'tool', actor: this.agent, title: court(o.nom, 140), public_title: t.outil, status: rate ? 'failed' : 'ok', attrs: { tool: o.nom } };
        if (contenu) e.detail = court(contenu, 300);
        return [e];
      }
      default:
        return [];                                      // STATE_*, MESSAGES_SNAPSHOT, RAW, CUSTOM, THINKING_*, inconnus
    }
  }

  /** Traduit une liste (ou un texte de flux) et rend les Wakil Events produits. */
  traduireTout(liste) {
    const evs = typeof liste === 'string' ? decoderFlux(liste) : Array.isArray(liste) ? liste : [liste];
    const sortie = [];
    for (const ev of evs) sortie.push(...this.traduire(ev));
    return sortie;
  }
}
