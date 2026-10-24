// Wakilarium — l'adaptateur Claude Code : les hooks de Claude Code deviennent des Wakil Events (spec §6.1).
// Deux faces : `traduire(hook)` (pur, testable) et l'installation dans ~/.claude/settings.json (idempotente, sauvegarde,
// consentement). L'adaptateur ne lit que les champs du hook, jamais les fichiers ni les secrets ; les chemins sont masqués
// dans les titres publics ; l'envoi au collecteur local n'attend jamais plus de 300 ms et n'échoue jamais bruyamment.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';

export const EVENEMENTS = ['SessionStart', 'SessionEnd', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Notification', 'Stop', 'SubagentStop'];
export const MARQUE = 'wakilarium';   // un hook à nous : une commande qui cite wakilarium et finit par « hook »
export const LANE = 'claude-code';

function court(s, n) { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function masque(chemin) { return chemin ? basename(String(chemin)) : ''; }

/** Résumé privé d'un appel d'outil, depuis ses arguments ; jamais le contenu écrit, seulement les noms. */
export function resumeOutil(nom, entree) {
  const e = entree && typeof entree === 'object' ? entree : {};
  if (e.file_path || e.path || e.notebook_path) return `${nom} · ${masque(e.file_path || e.path || e.notebook_path)}`;
  if (e.command) return `${nom} · ${court(e.command, 80)}`;
  if (e.pattern) return `${nom} · ${court(e.pattern, 60)}`;
  if (e.url) { try { return `${nom} · ${new URL(e.url).hostname}`; } catch { return nom; } }
  if (e.query) return `${nom} · ${court(e.query, 60)}`;
  if (e.description) return `${nom} · ${court(e.description, 80)}`;
  return String(nom || 'outil');
}

function echec(reponse) {
  if (!reponse) return false;
  if (typeof reponse === 'string') return /^(error|erreur)\b/i.test(reponse.trim());
  return !!(reponse.is_error || reponse.error || (reponse.success === false));
}

/**
 * Traduit le JSON reçu sur l'entrée standard d'un hook Claude Code en zéro, un ou deux Wakil Events.
 * @param {object} hook  champs usuels : hook_event_name, session_id, cwd, tool_name, tool_input, tool_response, prompt, message
 * @param {{maintenant?: string, nomSession?: string}} options
 */
export function traduire(hook, options = {}) {
  if (!hook || typeof hook !== 'object') return [];
  const ts = options.maintenant || new Date().toISOString();
  const sid = String(hook.session_id || 'session');
  const projet = options.nomSession || masque(hook.cwd) || 'Claude Code';
  const session = { id: `claude-${sid.slice(0, 8)}`, name: projet, role: 'Claude Code', lane: LANE, kind: 'agent' };
  const humain = { id: 'vous', name: 'Vous', kind: 'human', lane: 'direction' };
  const base = { v: '0.1', ts, source: 'claude-code', run_id: sid };
  switch (hook.hook_event_name) {
    case 'SessionStart':
      return [{ ...base, kind: 'run.start', actor: session, title: `Session ouverte dans ${projet}`, public_title: 'commence à travailler', status: 'running' }];
    case 'SessionEnd':
      return [{ ...base, kind: 'run.end', actor: session, title: 'Session terminée', public_title: 'a terminé', status: 'ok' }];
    case 'UserPromptSubmit':
      return [{ ...base, kind: 'message', actor: humain, target: session, title: court(hook.prompt, 140) || 'Une demande', public_title: 'une demande',
                detail: court(hook.prompt, 2000) }];
    case 'PreToolUse':
      return [{ ...base, kind: 'tool', actor: session, title: court(resumeOutil(hook.tool_name, hook.tool_input), 140), public_title: 'utilise un outil', status: 'running',
                attrs: { tool: hook.tool_name } }];
    case 'PostToolUse': {
      const rate = echec(hook.tool_response);
      return [{ ...base, kind: 'tool', actor: session, title: court(resumeOutil(hook.tool_name, hook.tool_input), 140), public_title: 'utilise un outil',
                status: rate ? 'failed' : 'ok', detail: typeof hook.tool_response === 'string' ? court(hook.tool_response, 300) : undefined, attrs: { tool: hook.tool_name } }];
    }
    case 'Notification':
      return [{ ...base, kind: 'message', actor: session, target: humain, title: court(hook.message, 140) || 'Notification', public_title: 'écrit à l’humain' }];
    case 'Stop':
      return [{ ...base, kind: 'run.end', actor: session, title: 'Réponse terminée', public_title: 'a terminé', status: 'ok' }];
    case 'SubagentStop':
      return [{ ...base, kind: 'run.end', actor: { id: `sous-agent-${sid.slice(0, 8)}`, name: 'Sous-agent', role: 'sous-agent', lane: LANE, kind: 'agent' },
                parent_id: sid, title: 'Sous-agent terminé', public_title: 'a terminé', status: 'ok' }];
    default:
      return [];
  }
}

/** Envoie des événements au collecteur local ; silencieux, borné à 300 ms. */
export async function envoyer(evenements, url) {
  if (!evenements.length) return false;
  const ctrl = new AbortController();
  const minuterie = setTimeout(() => ctrl.abort(), 300);
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(evenements), signal: ctrl.signal });
    return r.ok;
  } catch { return false; } finally { clearTimeout(minuterie); }
}

// ---------------------------------------------------------------- installation dans ~/.claude/settings.json

export function fichierReglages() { return process.env.CLAUDE_SETTINGS || join(homedir(), '.claude', 'settings.json'); }

export function lireReglages(fichier = fichierReglages()) {
  if (!existsSync(fichier)) return {};
  try { return JSON.parse(readFileSync(fichier, 'utf8')) || {}; } catch { throw new Error(`${fichier} n'est pas un JSON lisible ; rien n'est modifié.`); }
}

/** Les hooks tels qu'ils seront écrits : un groupe par événement, une seule commande, marquée pour être retrouvée. */
export function commandeHook(binaire) {
  return `node "${binaire}" hook`;
}

export function avecHooks(reglages, binaire) {
  const r = JSON.parse(JSON.stringify(reglages || {}));
  r.hooks = r.hooks && typeof r.hooks === 'object' && !Array.isArray(r.hooks) ? r.hooks : {};
  for (const ev of EVENEMENTS) {
    const groupes = Array.isArray(r.hooks[ev]) ? r.hooks[ev].filter((g) => !estNotre(g)) : [];
    groupes.push({ matcher: '', hooks: [{ type: 'command', command: commandeHook(binaire), timeout: 5 }] });
    r.hooks[ev] = groupes;
  }
  return r;
}

export function sansHooks(reglages) {
  const r = JSON.parse(JSON.stringify(reglages || {}));
  if (!r.hooks || typeof r.hooks !== 'object') return r;
  for (const ev of Object.keys(r.hooks)) {
    if (!Array.isArray(r.hooks[ev])) continue;
    r.hooks[ev] = r.hooks[ev].filter((g) => !estNotre(g));
    if (!r.hooks[ev].length) delete r.hooks[ev];
  }
  if (!Object.keys(r.hooks).length) delete r.hooks;
  return r;
}

function estNotre(groupe) {
  return !!(groupe && Array.isArray(groupe.hooks) && groupe.hooks.some((h) => typeof h.command === 'string' && /wakilarium.*\bhook\s*$/.test(h.command)));
}

export function installes(reglages) {
  const h = reglages && reglages.hooks;
  return !!(h && EVENEMENTS.some((ev) => Array.isArray(h[ev]) && h[ev].some(estNotre)));
}

/** Écrit les réglages avec une sauvegarde datée à côté ; rend le chemin de la sauvegarde (ou null s'il n'y avait rien). */
export function ecrireReglages(reglages, fichier = fichierReglages()) {
  mkdirSync(join(fichier, '..'), { recursive: true });
  let sauvegarde = null;
  if (existsSync(fichier)) { sauvegarde = `${fichier}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`; copyFileSync(fichier, sauvegarde); }
  writeFileSync(fichier, JSON.stringify(reglages, null, 2) + '\n');
  return sauvegarde;
}
