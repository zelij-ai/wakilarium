// Wakilarium — tests des adaptateurs OpenTelemetry GenAI (spec §6.2) et AG-UI (spec §6.3), et de leur réception par le collecteur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Magasin, valider } from '../src/magasin.js';
import { evenementPublic } from '../src/public.js';
import { traduireTraces, chiffrer, cleModele, millis, nature, tarifs, TARIFS } from '../src/otel.js';
import { TraducteurAgui, decoderFlux } from '../src/agui.js';
import { creerServeur } from '../src/collecteur.js';

const NS = (iso) => String(BigInt(Date.parse(iso)) * 1000000n);
const attr = (key, v) => ({ key, value: typeof v === 'number' ? (Number.isInteger(v) ? { intValue: String(v) } : { doubleValue: v }) : typeof v === 'boolean' ? { boolValue: v } : { stringValue: String(v) } });
const span = (spanId, name, debut, fin, attrs, extra = {}) => ({ traceId: 'trace-1', spanId, name, startTimeUnixNano: NS(debut), endTimeUnixNano: fin ? NS(fin) : '0', attributes: Object.entries(attrs).map(([k, v]) => attr(k, v)), status: { code: 'STATUS_CODE_UNSET' }, ...extra });
const requete = (spans, service = 'bureau') => ({ resourceSpans: [{ resource: { attributes: [attr('service.name', service)] }, scopeSpans: [{ scope: { name: 'test' }, spans }] }] });

test('OpenTelemetry : invoke_agent → run.start + run.end, execute_tool → tool, chat → coût rattaché à l’exécution', () => {
  const r = requete([
    span('a1', 'invoke_agent Élise', '2026-11-06T09:00:00Z', '2026-11-06T09:00:30Z', { 'gen_ai.operation.name': 'invoke_agent', 'gen_ai.agent.name': 'Élise Tanguy', 'gen_ai.agent.id': 'croissance', 'gen_ai.provider.name': 'anthropic' }),
    span('t1', 'execute_tool chercher', '2026-11-06T09:00:05Z', '2026-11-06T09:00:07Z', { 'gen_ai.operation.name': 'execute_tool', 'gen_ai.tool.name': 'chercher' }, { parentSpanId: 'a1' }),
    span('c1', 'chat claude-sonnet-4-5', '2026-11-06T09:00:08Z', '2026-11-06T09:00:20Z', { 'gen_ai.operation.name': 'chat', 'gen_ai.request.model': 'claude-sonnet-4-5', 'gen_ai.usage.input_tokens': 1000000, 'gen_ai.usage.output_tokens': 100000, 'gen_ai.prompt': 'SECRET DU PROMPT' }, { parentSpanId: 'a1' }),
    span('t2', 'execute_tool ecrire', '2026-11-06T09:00:21Z', '2026-11-06T09:00:22Z', { 'gen_ai.operation.name': 'execute_tool', 'gen_ai.tool.name': 'ecrire' }, { parentSpanId: 'a1', status: { code: 2, message: 'disque plein' } }),
  ]);
  const evs = traduireTraces(r, { lang: 'fr' });
  assert.deepEqual(evs.map((e) => e.kind), ['run.start', 'tool', 'tool', 'run.end']);
  const [debut, outil, rate, fin] = evs;
  assert.equal(debut.actor.id, 'croissance'); assert.equal(debut.actor.name, 'Élise Tanguy'); assert.equal(debut.actor.lane, 'bureau'); assert.equal(debut.run_id, 'trace-1'); assert.equal(debut.status, 'running');
  assert.equal(outil.title, 'chercher'); assert.equal(outil.parent_id, 'a1'); assert.equal(outil.status, 'ok'); assert.equal(outil.actor.id, 'croissance'); assert.equal(outil.attrs.duration_ms, 2000);
  assert.equal(rate.status, 'failed'); assert.equal(rate.detail, 'disque plein');
  assert.equal(fin.ts, '2026-11-06T09:00:30.000Z'); assert.equal(fin.status, 'ok'); assert.equal(fin.id, 'a1:end');
  assert.deepEqual(fin.cost, { amount: 4.5, currency: 'USD', tokens_in: 1000000, tokens_out: 100000, model: 'claude-sonnet-4-5' });   // 1 M × 3 $ + 0,1 M × 15 $
  assert.equal(fin.attrs.provider, 'anthropic');
  assert.equal(JSON.stringify(evs).includes('SECRET'), false);
  evs.forEach((e) => assert.equal(valider(e).ok, true, e.kind));
  assert.equal(evenementPublic(fin).title, 'a terminé');
});

test('OpenTelemetry : span de modèle isolé → événement cost ; modèle sans tarif → jetons sans montant ; span en cours → run.start seul', () => {
  const evs = traduireTraces(requete([
    span('c9', 'chat gpt-4o-mini', '2026-11-06T10:00:00Z', '2026-11-06T10:00:02Z', { 'gen_ai.operation.name': 'chat', 'gen_ai.response.model': 'gpt-4o-mini-2024-07-18', 'gen_ai.usage.input_tokens': 2000000, 'gen_ai.usage.output_tokens': 0, 'gen_ai.system': 'openai' }),
    span('c8', 'chat inconnu', '2026-11-06T10:01:00Z', '2026-11-06T10:01:02Z', { 'gen_ai.operation.name': 'chat', 'gen_ai.request.model': 'modele-maison-7b', 'gen_ai.usage.input_tokens': 10, 'gen_ai.usage.output_tokens': 5 }),
    span('a7', 'invoke_agent', '2026-11-06T10:02:00Z', null, { 'gen_ai.operation.name': 'invoke_agent', 'gen_ai.agent.name': 'Veilleur' }),
  ], 'api'), { lang: 'en' });
  assert.deepEqual(evs.map((e) => e.kind), ['cost', 'cost', 'run.start']);
  assert.equal(evs[0].cost.amount, 0.3); assert.equal(evs[0].cost.model, 'gpt-4o-mini-2024-07-18'); assert.equal(evs[0].attrs.provider, 'openai'); assert.equal(evs[0].actor.id, 'api');
  assert.equal('cost' in evs[1], false); assert.equal(evs[1].attrs.unpriced, true); assert.equal(evs[1].attrs.tokens_in, 10); assert.equal(evs[1].attrs.tarifs, TARIFS.date);
  assert.equal(evs[2].public_title, 'starts working'); assert.equal(evs[2].actor.id, 'veilleur');
  assert.equal(evenementPublic(evs[0]), null);                             // un coût ne sort jamais en public
});

test('OpenTelemetry : OpenInference, valeurs OTLP, clés de modèles, tarifs personnels', () => {
  const evs = traduireTraces(requete([
    span('o1', 'agent', '2026-11-06T11:00:00Z', '2026-11-06T11:00:10Z', { 'openinference.span.kind': 'AGENT', 'gen_ai.agent.name': 'Planificateur' }),
    span('o2', 'outil', '2026-11-06T11:00:01Z', '2026-11-06T11:00:02Z', { 'openinference.span.kind': 'TOOL', 'tool.name': 'calculer' }, { parentSpanId: 'o1' }),
    span('o3', 'llm', '2026-11-06T11:00:03Z', '2026-11-06T11:00:09Z', { 'openinference.span.kind': 'LLM', 'llm.model_name': 'x', 'gen_ai.request.model': 'gemini-2.5-flash', 'llm.token_count.prompt': 1000000, 'llm.token_count.completion': 0 }, { parentSpanId: 'o1' }),
  ]));
  assert.deepEqual(evs.map((e) => e.kind), ['run.start', 'tool', 'run.end']);
  assert.equal(evs[1].title, 'calculer'); assert.equal(evs[2].cost.amount, 0.3);
  assert.equal(nature({ name: 'invoke_agent x' }, {}), 'agent'); assert.equal(nature({ name: 'db.query' }, {}), null);
  assert.equal(millis('1762426800000000000'), 1762426800000); assert.equal(millis(1762426800000000000), 1762426800000); assert.equal(millis('0'), null);
  assert.equal(cleModele('Claude-Sonnet-4.5-20250929'), 'claude-sonnet-4-5'); assert.equal(cleModele('gpt-4.1-mini'), 'gpt-4-1-mini'); assert.equal(cleModele('models/gemini-2.5-pro@001'), 'models/gemini-2-5-pro');
  assert.equal(chiffrer('claude-opus-4-1', 1000000, 1000000), 90); assert.equal(chiffrer('inconnu', 1, 1), null);
  const dossier = mkdtempSync(join(tmpdir(), 'wk-tarifs-'));
  assert.equal(tarifs(dossier), TARIFS);
  writeFileSync(join(dossier, 'tarifs.json'), JSON.stringify({ date: '2026-12-01', modeles: { 'modele-maison-7b': [0.5, 1] } }));
  const perso = tarifs(dossier);
  assert.equal(perso.date, '2026-12-01'); assert.equal(chiffrer('modele-maison-7b', 1000000, 1000000, perso), 1.5); assert.equal(chiffrer('gpt-4o', 1000000, 0, perso), 2.5);
  assert.deepEqual(traduireTraces({}), []); assert.deepEqual(traduireTraces(null), []);
});

test('AG-UI : exécution, message assemblé, outil mis à jour sous le même identifiant, étapes, états ignorés', () => {
  const tr = new TraducteurAgui({ lang: 'fr', agent: { id: 'assistant', name: 'Assistant', lane: 'support' }, maintenant: () => Date.parse('2026-11-06T12:00:00Z') });
  const evs = tr.traduireTout([
    { type: 'RUN_STARTED', threadId: 'th1', runId: 'r1', timestamp: Date.parse('2026-11-06T12:00:00Z') },
    { type: 'STATE_SNAPSHOT', snapshot: { secret: 'non' } },
    { type: 'STEP_STARTED', stepName: 'plan' },
    { type: 'TEXT_MESSAGE_START', messageId: 'm1', role: 'user' },
    { type: 'TEXT_MESSAGE_CONTENT', messageId: 'm1', delta: 'Trouve-moi ' },
    { type: 'TEXT_MESSAGE_CONTENT', messageId: 'm1', delta: 'un vol pour Lyon' },
    { type: 'TEXT_MESSAGE_END', messageId: 'm1' },
    { type: 'TOOL_CALL_START', toolCallId: 'tc1', toolCallName: 'chercher_vols', parentMessageId: 'm2' },
    { type: 'TOOL_CALL_ARGS', toolCallId: 'tc1', delta: '{"carte": "4970 SECRET"}' },
    { type: 'TOOL_CALL_END', toolCallId: 'tc1' },
    { type: 'TOOL_CALL_RESULT', messageId: 'm3', toolCallId: 'tc1', content: '3 vols trouvés' },
    { type: 'TEXT_MESSAGE_START', messageId: 'm2', role: 'assistant' },
    { type: 'TEXT_MESSAGE_CONTENT', messageId: 'm2', delta: 'Voici trois vols ' + 'x'.repeat(300) },
    { type: 'TEXT_MESSAGE_END', messageId: 'm2' },
    { type: 'STEP_FINISHED', stepName: 'plan' },
    { type: 'RUN_FINISHED', threadId: 'th1', runId: 'r1' },
  ]);
  assert.deepEqual(evs.map((e) => e.kind), ['run.start', 'note', 'message', 'tool', 'tool', 'message', 'note', 'run.end']);
  const [debut, , demande, outilDebut, outilFin, reponse, , fin] = evs;
  assert.equal(debut.actor.id, 'assistant'); assert.equal(debut.run_id, 'r1'); assert.equal(debut.attrs.thread, 'th1'); assert.equal(debut.ts, '2026-11-06T12:00:00.000Z');
  assert.equal(demande.actor.kind, 'human'); assert.equal(demande.target.id, 'assistant'); assert.equal(demande.title, 'Trouve-moi un vol pour Lyon'); assert.equal(demande.public_title, 'une demande');
  assert.equal(outilDebut.id, 'tool-tc1'); assert.equal(outilDebut.status, 'running'); assert.equal(outilDebut.parent_id, 'msg-m2');
  assert.equal(outilFin.id, 'tool-tc1'); assert.equal(outilFin.status, 'ok'); assert.equal(outilFin.title, 'chercher_vols'); assert.equal(outilFin.detail, '3 vols trouvés');
  assert.equal(reponse.actor.id, 'assistant'); assert.equal(reponse.target.kind, 'human'); assert.equal(reponse.public_title, 'répond'); assert.equal(reponse.title.length, 140); assert.equal(reponse.id, 'msg-m2');
  assert.equal(fin.status, 'ok'); assert.equal(fin.id, 'r1:end'); assert.equal(fin.run_id, 'r1');
  assert.equal(JSON.stringify(evs).includes('SECRET'), false);
  evs.forEach((e) => assert.equal(valider(e).ok, true, e.kind));
  const erreur = tr.traduireTout([{ type: 'RUN_STARTED', runId: 'r2' }, { type: 'RUN_ERROR', message: 'quota dépassé', code: 'E42' }]);
  assert.equal(erreur[1].kind, 'run.end'); assert.equal(erreur[1].status, 'failed'); assert.equal(erreur[1].run_id, 'r2'); assert.equal(erreur[1].attrs.code, 'E42'); assert.equal(erreur[1].detail, 'quota dépassé');
  assert.deepEqual(tr.traduire({ type: 'INCONNU' }), []); assert.deepEqual(tr.traduire(null), []);
  assert.equal(decoderFlux('event: x\ndata: {"type":"RUN_STARTED","runId":"a"}\n\ndata: {"type":"RUN_FINISHED","runId":"a"}\n').length, 2);
  assert.equal(decoderFlux('{"type":"RUN_STARTED"}\n{"type":"RUN_FINISHED"}').length, 2); assert.equal(decoderFlux('[{"type":"RUN_STARTED"}]').length, 1); assert.deepEqual(decoderFlux(''), []);
});

test('magasin : un événement renvoyé avec le même id remplace le précédent, en mémoire comme après rechargement', () => {
  const dossier = mkdtempSync(join(tmpdir(), 'wk-maj-'));
  const m = new Magasin({ dossier });
  const ts = new Date().toISOString();
  const base = { v: '0.1', ts, kind: 'tool', actor: { id: 'a' }, id: 'tool-1', title: 'chercher' };
  m.ajouter([{ ...base, status: 'running' }]);
  m.ajouter([{ ...base, status: 'ok' }]);
  assert.equal(m.evenements.length, 1); assert.equal(m.evenements[0].status, 'ok');
  const m2 = new Magasin({ dossier });
  assert.equal(m2.evenements.length, 1); assert.equal(m2.evenements[0].status, 'ok');
  const petit = new Magasin({ persister: false, memoireMax: 2 });
  petit.ajouter([{ ...base, id: 'x1' }, { ...base, id: 'x2' }, { ...base, id: 'x3' }]);
  assert.equal(petit.evenements.length, 2); assert.equal(petit.parId.has('x1'), false); assert.equal(petit.parId.has('x3'), true);
});

test('serveur : POST /v1/traces (OTLP JSON, protobuf refusé) et POST /agui (SSE, état gardé entre les appels)', async () => {
  const magasin = new Magasin({ persister: false });
  const serveur = creerServeur({ magasin, jeton: 'j', dossier: mkdtempSync(join(tmpdir(), 'wk-ad-')), agent: { id: 'bot', name: 'Bot' } });
  await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const maintenant = new Date().toISOString();
  const otlp = await fetch(`${base}/v1/traces`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(requete([span('s1', 'invoke_agent', maintenant, maintenant, { 'gen_ai.operation.name': 'invoke_agent', 'gen_ai.agent.name': 'Élise' })])) });
  assert.equal(otlp.status, 200); assert.deepEqual(await otlp.json(), {});
  assert.equal((await fetch(`${base}/v1/traces`, { method: 'POST', headers: { 'content-type': 'application/x-protobuf' }, body: 'x' })).status, 415);
  assert.equal((await fetch(`${base}/v1/traces`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' })).status, 400);
  const a1 = await fetch(`${base}/agui`, { method: 'POST', headers: { 'content-type': 'text/event-stream' }, body: 'data: {"type":"RUN_STARTED","runId":"r9"}\n\ndata: {"type":"TEXT_MESSAGE_START","messageId":"m","role":"assistant"}\n' });
  assert.equal(a1.status, 202); assert.equal((await a1.json()).accepted, 1);
  const a2 = await fetch(`${base}/agui`, { method: 'POST', body: '{"type":"TEXT_MESSAGE_CONTENT","messageId":"m","delta":"Bonjour"}\n{"type":"TEXT_MESSAGE_END","messageId":"m"}\n{"type":"RUN_FINISHED","runId":"r9"}' });
  assert.equal((await a2.json()).accepted, 2);
  const s = await (await fetch(`${base}/state`)).json();
  assert.deepEqual(s.events.map((e) => e.kind), ['run.start', 'run.end', 'run.start', 'message', 'run.end']);
  assert.equal(s.events[3].title, 'Bonjour'); assert.equal(s.events[3].actor.id, 'bot'); assert.equal(s.events[0].source, 'otel-genai'); assert.equal(s.events[2].source, 'ag-ui');
  const j = await (await fetch(`${base}/jeton`)).json(); assert.equal(j.otlp_traces_url, '/v1/traces'); assert.equal(j.agui_url, '/agui');
  serveur.close();
});
