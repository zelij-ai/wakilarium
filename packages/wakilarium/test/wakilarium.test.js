// Wakilarium — tests du paquet (node:test, aucune dépendance) : format, magasin, vue publique, hook Claude Code, serveur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Magasin, valider, etat } from '../src/magasin.js';
import { etatPublic, evenementPublic } from '../src/public.js';
import { traduire, avecHooks, sansHooks, installes, lireReglages, ecrireReglages, resumeOutil } from '../src/hooks.js';
import { creerServeur, decoder, chargerDemo } from '../src/collecteur.js';
import { badgeSvg } from '../src/badge.js';

const ACTEUR = { id: 'croissance', name: 'Élise Tanguy', role: 'marketing', lane: 'marketing' };
const ev = (sur) => ({ v: '0.1', ts: '2026-10-24T10:00:00+02:00', kind: 'message', actor: ACTEUR, title: 'Bonjour', ...sur });

test('valider : obligatoires, énumérations, bornes, champs inconnus conservés', () => {
  assert.equal(valider(ev()).ok, true);
  assert.equal(valider(ev({ v: '0.2' })).ok, false);
  assert.equal(valider(ev({ kind: 'danse' })).ok, false);
  assert.equal(valider(ev({ actor: {} })).ok, false);
  assert.equal(valider(ev({ title: '' })).ok, false);
  assert.equal(valider(ev({ ts: 'hier' })).ok, false);
  const long = valider(ev({ title: 'x'.repeat(200), status: 'bizarre', extra: 1 }));
  assert.equal(long.evenement.title.length, 140); assert.equal('status' in long.evenement, false); assert.equal(long.evenement.extra, 1); assert.ok(long.evenement.id);
  assert.equal(valider(ev({ detail: 'y'.repeat(20000) })).ok, false);   // > 16 Ko
});

test('magasin : ajout, tri, fenêtre bornée, persistance NDJSON', () => {
  const dossier = mkdtempSync(join(tmpdir(), 'wk-'));
  const m = new Magasin({ dossier });
  const r = m.ajouter([ev({ ts: '2026-10-24T11:00:00Z' }), ev({ ts: '2026-10-24T09:00:00Z' }), { v: '0.1' }]);
  assert.equal(r.acceptes, 2); assert.equal(r.refuses.length, 1);
  assert.deepEqual(m.evenements.map((e) => e.ts), ['2026-10-24T09:00:00Z', '2026-10-24T11:00:00Z']);
  assert.ok(existsSync(join(dossier, 'events.ndjson')) && readFileSync(join(dossier, 'events.ndjson'), 'utf8').split('\n').filter(Boolean).length === 2);
  const m2 = new Magasin({ dossier });                                   // rechargé depuis le disque
  assert.equal(m2.evenements.length, 2);
  const f = m2.fenetre(1, Date.parse('2026-10-24T11:30:00Z'));
  assert.equal(f.evenements.length, 1);
  const s = etat(m2, 24, Date.parse('2026-10-24T12:00:00Z'));
  assert.deepEqual(s.lanes, ['marketing']); assert.equal(s.actors[0].name, 'Élise Tanguy'); assert.equal(s.events.length, 2);
});

test('état : couloirs, humain en direction, visiteur à l’entrée, totaux', () => {
  const m = new Magasin({ persister: false });
  m.ajouter([
    ev({ kind: 'run.start', ts: '2026-10-24T09:00:00Z', cost: { amount: 0.5, currency: 'EUR' } }),
    ev({ kind: 'decision.open', ts: '2026-10-24T09:10:00Z', actor: { id: 'chef', name: 'Camille', lane: 'direction' }, target: { id: 'vous', kind: 'human' } }),
    ev({ kind: 'visitor', ts: '2026-10-24T09:20:00Z', actor: { id: 'muse', name: 'Muse', kind: 'visitor' }, title: 'lit le catalogue' }),
  ]);
  const s = etat(m, 24, Date.parse('2026-10-24T10:00:00Z'));
  assert.deepEqual(s.lanes, ['marketing', 'direction', 'entree']);
  assert.equal(s.actors.find((a) => a.id === 'vous').lane, 'direction'); assert.equal(s.actors.find((a) => a.id === 'muse').lane, 'entree');
  assert.deepEqual(s.totals, { cost: 0.5, runs: 1, pending_decisions: 1 });
});

test('vue publique : titres publics ou génériques, jamais detail/attrs/cost, coût isolé absent', () => {
  const e = evenementPublic(ev({ detail: 'secret', attrs: { k: 1 }, cost: { amount: 2, currency: 'EUR' }, public_title: 'propose' }));
  assert.deepEqual(Object.keys(e).sort(), ['actor', 'id', 'kind', 'title', 'ts', 'v'].sort()); assert.equal(e.title, 'propose');
  assert.equal(evenementPublic(ev({ kind: 'tool' }), 'en').title, 'uses a tool');
  assert.equal(evenementPublic(ev({ kind: 'run.end', status: 'failed' })).title, 'a échoué');
  assert.equal(evenementPublic(ev({ kind: 'cost' })), null);
  const m = new Magasin({ persister: false }); m.ajouter([ev({ cost: { amount: 3, currency: 'EUR' } })]);
  const p = etatPublic(etat(m, 24, Date.parse('2026-10-24T12:00:00Z')));
  assert.equal('cost' in p.totals, false); assert.equal(p.public, true); assert.equal(JSON.stringify(p).includes('secret'), false);
});

test('hook Claude Code : chaque événement du hook devient le bon Wakil Event, sans secret', () => {
  const o = { maintenant: '2026-10-24T10:00:00Z' };
  const debut = traduire({ hook_event_name: 'SessionStart', session_id: 'abcdef1234', cwd: 'C:\\web\\zelij-os' }, o)[0];
  assert.equal(debut.kind, 'run.start'); assert.equal(debut.actor.id, 'claude-abcdef12'); assert.equal(debut.actor.name, 'zelij-os'); assert.equal(debut.run_id, 'abcdef1234');
  const demande = traduire({ hook_event_name: 'UserPromptSubmit', session_id: 'abcdef1234', prompt: 'Corrige le bug de ' + 'x'.repeat(300) }, o)[0];
  assert.equal(demande.kind, 'message'); assert.equal(demande.actor.kind, 'human'); assert.equal(demande.target.id, 'claude-abcdef12'); assert.equal(demande.public_title, 'une demande'); assert.ok(demande.title.length <= 140);
  const pre = traduire({ hook_event_name: 'PreToolUse', session_id: 's', tool_name: 'Edit', tool_input: { file_path: '/home/x/secret/.env', old_string: 'KEY=abc' } }, o)[0];
  assert.equal(pre.kind, 'tool'); assert.equal(pre.status, 'running'); assert.equal(pre.title, 'Edit · .env'); assert.equal(JSON.stringify(pre).includes('KEY=abc'), false);
  const post = traduire({ hook_event_name: 'PostToolUse', session_id: 's', tool_name: 'Bash', tool_input: { command: 'pytest -q' }, tool_response: { is_error: true } }, o)[0];
  assert.equal(post.status, 'failed'); assert.equal(post.title, 'Bash · pytest -q');
  assert.equal(traduire({ hook_event_name: 'Stop', session_id: 's' }, o)[0].kind, 'run.end');
  assert.equal(traduire({ hook_event_name: 'Notification', session_id: 's', message: 'Permission ?' }, o)[0].target.id, 'vous');
  assert.equal(traduire({ hook_event_name: 'SubagentStop', session_id: 's' }, o)[0].parent_id, 's');
  assert.deepEqual(traduire({ hook_event_name: 'PreCompact' }, o), []); assert.deepEqual(traduire(null), []);
  assert.equal(resumeOutil('WebFetch', { url: 'https://example.com/a/b?x=1' }), 'WebFetch · example.com');
  traduire({ hook_event_name: 'SessionStart', session_id: 's' }, o).forEach((e) => assert.equal(valider(e).ok, true));
});

test('réglages Claude Code : installation idempotente, retrait propre, sauvegarde', () => {
  const r0 = { model: 'x', hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo autre' }] }] } };
  const r1 = avecHooks(r0, '/chemin/bin/wakilarium.js');
  assert.equal(installes(r1), true); assert.equal(installes(r0), false);
  assert.equal(r1.hooks.PreToolUse.length, 2); assert.equal(r1.hooks.PreToolUse[0].hooks[0].command, 'echo autre');
  assert.match(r1.hooks.Stop[0].hooks[0].command, /wakilarium.js" hook$/); assert.equal(r1.model, 'x');
  const r2 = avecHooks(r1, '/chemin/bin/wakilarium.js');
  assert.equal(r2.hooks.PreToolUse.length, 2);                          // pas de doublon
  const r3 = sansHooks(r2);
  assert.equal(installes(r3), false); assert.equal(r3.hooks.PreToolUse.length, 1); assert.equal('Stop' in r3.hooks, false);
  const dossier = mkdtempSync(join(tmpdir(), 'wk-cfg-'));
  const f = join(dossier, 'settings.json');
  assert.equal(ecrireReglages(r1, f), null);                             // rien à sauvegarder la première fois
  const sauvegarde = ecrireReglages(r3, f);
  assert.ok(sauvegarde && existsSync(sauvegarde)); assert.deepEqual(lireReglages(f), r3);
});

test('décodage : tableau, objet, NDJSON', () => {
  assert.equal(decoder('[{"a":1}]').length, 1); assert.equal(decoder('{"a":1}').length, 1); assert.equal(decoder('{"a":1}\n{"a":2}\n').length, 2); assert.deepEqual(decoder(''), []);
});

test('serveur : POST /events, GET /state, /stream, page publique par jeton, badge, 404', async () => {
  const magasin = new Magasin({ persister: false });
  const serveur = creerServeur({ magasin, jeton: 'jetondetest', dossier: mkdtempSync(join(tmpdir(), 'wk-srv-')) });
  await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const maintenant = new Date().toISOString();
  const post = await fetch(`${base}/events`, { method: 'POST', body: JSON.stringify([ev({ ts: maintenant, detail: 'privé', cost: { amount: 1, currency: 'EUR' } }), { v: '0.1' }]) });
  assert.equal(post.status, 202); assert.deepEqual((await post.json()).accepted, 1);
  const s = await (await fetch(`${base}/state`)).json();
  assert.equal(s.events.length, 1); assert.equal(s.events[0].detail, 'privé'); assert.equal(s.totals.cost, 1);
  const p = await (await fetch(`${base}/public/jetondetest`)).json();
  assert.equal(p.public, true); assert.equal('detail' in p.events[0], false); assert.equal('cost' in p.totals, false);
  assert.equal((await fetch(`${base}/public/autrejeton`)).status, 404);
  const svg = await (await fetch(`${base}/badge.svg`)).text();
  assert.ok(svg.startsWith('<svg') && svg.includes('WAKILARIUM') && !svg.includes('privé'));
  const html = await fetch(`${base}/`); assert.equal(html.status, 200); assert.ok((await html.text()).includes('<wakil-arium')); assert.ok(html.headers.get('content-security-policy').includes("default-src 'none'"));
  assert.equal((await fetch(`${base}/wakilarium.js`)).status, 200);
  assert.equal((await fetch(`${base}/events`, { method: 'POST', body: 'pas du json' })).status, 400);
  assert.equal((await fetch(`${base}/nimporte`)).status, 404);
  const exp = await (await fetch(`${base}/export.wakil`)).text(); assert.ok(exp.includes('"detail":"privé"'));
  const expPub = await (await fetch(`${base}/public/jetondetest/export.wakil`)).text(); assert.equal(expPub.includes('privé'), false);
  serveur.close();
});

test('démo : la journée fictive est décalée sur aujourd’hui', () => {
  const m = new Magasin({ persister: false });
  const n = chargerDemo(m, undefined, Date.parse('2026-10-24T15:00:00Z'));
  assert.ok(n >= 15); assert.equal(m.evenements[m.evenements.length - 1].ts, '2026-10-24T15:00:00.000Z'); assert.equal(m.evenements[0].source, 'demo');
  const svg = badgeSvg(etatPublic(etat(m, 24, Date.parse('2026-10-24T15:00:00Z'))), { theme: 'day' });
  assert.ok(svg.includes('agents') && svg.includes('#f6f2ea'));
});
