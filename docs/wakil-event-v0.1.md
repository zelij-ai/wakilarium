# Wakil Event v0.1 — le format ouvert de visualisation d'agents 

Date : 19/10/2026. Statut : proposition pour relecture avant le lot 1 ; les retours sont bienvenus par issue. Licence du format et des adaptateurs : Apache 2.0. Schéma JSON : `schema/wakil-event-0.1.schema.json`.

## 1. Ce que le format décrit

Un **Wakil Event** est un fait daté, produit par un agent, un humain, un service ou un visiteur, que l'on peut mettre en scène : « qui a fait quoi, quand, vers qui, avec quel coût et quel état ». Il ne décrit ni la pensée du modèle ni le contenu des outils : c'est un format de **visualisation et de preuve légère**, pas une trace d'exécution complète. Les traces complètes existent déjà (OpenTelemetry) ; Wakil Event est le pivot vers lequel on les projette.

Trois principes :
1. **Un événement, une ligne** : NDJSON, lisible, diffable, rejouable.
2. **Public par construction** : chaque événement sépare ce qui peut s'afficher sur une page publique (`public_title`) de ce qui reste privé (`title`, `detail`, `attrs`, `cost`). Une vue publique ne lit jamais les champs privés.
3. **Sans vérité imposée** : les couloirs, rôles et noms sont libres ; le composant regroupe, il n'interprète pas.

## 2. L'objet

| Champ | Type | Obligatoire | Sens |
|---|---|---|---|
| `v` | `"0.1"` | oui | version du format |
| `ts` | date-heure ISO 8601 avec fuseau | oui | instant du fait |
| `kind` | énumération (§3) | oui | nature du fait |
| `actor` | Acteur (§4) | oui | qui agit |
| `target` | Acteur | non | à qui le fait s'adresse (le fondateur, un autre agent, un visiteur) |
| `title` | texte ≤ 140 | oui | le fait, en clair, pour la vue privée |
| `public_title` | texte ≤ 140 | non | le fait tel qu'une page publique peut l'afficher ; absent = libellé générique de la nature (§3) |
| `detail` | texte ≤ 2 000 | non | précision privée (consigne, extrait, erreur) |
| `status` | `ok` · `running` · `failed` · `approved` · `refused` · `changes` · `pending` | non | état du fait, selon la nature |
| `cost` | `{amount, currency, tokens_in?, tokens_out?, model?}` | non | coût du fait ; `currency` ISO 4217 ; privé par défaut |
| `run_id` | texte | non | regroupe les faits d'une même exécution |
| `parent_id` | texte | non | fait parent (sous-agent, outil dans une exécution) |
| `id` | texte | non | identifiant unique ; le collecteur en attribue un s'il manque |
| `source` | texte | non | adaptateur d'origine : `claude-code`, `otel-genai`, `ag-ui`, `zelij-core`, `zelij-os`, `connecteur`, `manuel` |
| `attrs` | objet libre | non | tout le reste ; privé, jamais affiché tel quel |

Taille maximale d'un événement : 16 Ko. Les champs inconnus sont conservés et ignorés.

## 3. Les natures (`kind`) et leur libellé public par défaut

| `kind` | Quand | Libellé public si `public_title` absent | Rendu dans la scène |
|---|---|---|---|
| `run.start` | un agent commence une exécution | « commence à travailler » | anneau qui s'allume |
| `run.end` | il termine (`status` ok / failed) | « a terminé » / « a échoué » | anneau qui s'éteint, point rouge si échec |
| `tool` | un outil est appelé (`status` running / ok / failed) | « utilise un outil » | étincelle sur l'anneau |
| `message` | un échange adressé à quelqu'un | « échange avec … » | carte reliée à la cible |
| `decision.open` | un paquet de décision est proposé à un humain | « propose une décision » | carte dorée vers le fondateur |
| `decision.made` | l'humain tranche (`status` approved / refused / changes) | « a décidé » | carte dorée depuis le fondateur, comète sur le lien |
| `visitor` | un agent extérieur (Muse, dots, robot) frappe à la porte : catalogue lu, devis demandé, commande | « un visiteur » | silhouette en pointillé à l'entrée du couloir |
| `launch` | une mise en ligne, une publication | « met en ligne » | fusée sur le couloir |
| `cost` | un coût sans autre fait (relevé, facture) | (jamais affiché en public) | compteur du jour |
| `note` | tout le reste (étape, annotation) | « note » | point discret |

## 4. L'acteur

```json
{"id": "croissance", "name": "Élise Tanguy", "role": "marketing et produits", "lane": "marketing", "kind": "agent", "avatar": "https://…/croissance.webp"}
```

`id` obligatoire ; `kind` ∈ `agent` · `human` · `service` · `visitor` (défaut `agent`). `lane` libre : le composant crée un couloir par valeur rencontrée, dans l'ordre d'apparition, sauf configuration explicite. Un acteur `human` est dessiné en or : c'est celui qui décide. Un `visitor` n'a pas d'anneau plein : silhouette en pointillé.

## 5. Transport et lecture

- **Écriture** : `POST /events` (corps NDJSON ou tableau JSON, 1 000 événements par appel au plus) ; fichier `.ndjson` suivi par le collecteur ; récepteur OTLP/HTTP (JSON) pour les traces GenAI.
- **Lecture** : `GET /state?hours=24` rend `{window, lanes[], actors[], events[], totals{cost, runs, pending_decisions}}` ; forme compatible avec l'`etat` de l'aquarium de Zelij Core pour que la bascule soit une projection, pas une réécriture.
- **Public** : `GET /public/{jeton}` rend la même forme avec `title := public_title ou libellé générique`, sans `detail`, `attrs`, `cost` par événement ; le total de coût n'apparaît que si le collecteur est configuré `public_cost: true`.
- **Bornes** : 300 événements rendus par fenêtre (les plus récents), 24 h par défaut, 7 jours au plus.

## 6. Tables de correspondance (adaptateurs de la v1)

### 6.1 Hooks Claude Code / Agent SDK
| Hook | Wakil Event |
|---|---|
| `SessionStart` | `run.start`, actor = la session (nom configurable), `run_id` = session_id |
| `UserPromptSubmit` | `message` d'un acteur `human` vers la session ; `detail` = la demande (privé), `public_title` = « une demande » |
| `PreToolUse` | `tool` `running`, `title` = nom de l'outil ; chemins masqués dans `public_title` |
| `PostToolUse` | `tool` `ok` (ou `failed` si l'outil a échoué), `detail` = résumé tronqué |
| `SubagentStart` / `SubagentStop` | `run.start` / `run.end` d'un acteur enfant, `parent_id` = l'exécution parente |
| `Notification` | `message` vers l'humain |
| `Stop` | `run.end` `ok` |
Aucun secret lu : l'adaptateur ne lit que les champs du hook, jamais les fichiers.

### 6.2 OpenTelemetry GenAI (conventions sémantiques) / OpenInference
| Span ou attribut | Wakil Event |
|---|---|
| span `invoke_agent` (`gen_ai.agent.name`) | `run.start` à `start_time`, `run.end` à `end_time`, `status` d'après le statut du span |
| span `execute_tool` (`gen_ai.tool.name`) | `tool`, `parent_id` = span parent |
| span `chat` / `generate_content` (`gen_ai.request.model`, `gen_ai.usage.input_tokens`, `output_tokens`) | `cost` rattaché à l'exécution, `tokens_in/out`, `model` ; montant calculé par le collecteur d'après une table de tarifs datée |
| `gen_ai.provider.name` | `attrs.provider` |
| OpenInference `openinference.span.kind` = AGENT / TOOL / LLM | même projection que ci-dessus |
Les contenus de prompts et de réponses ne sont jamais copiés dans un Wakil Event.

### 6.3 AG-UI (événements agent → interface)
| AG-UI | Wakil Event |
|---|---|
| `RUN_STARTED` / `RUN_FINISHED` / `RUN_ERROR` | `run.start` / `run.end ok` / `run.end failed` (`run_id` = runId) |
| `TOOL_CALL_START` / `TOOL_CALL_ARGS` / `TOOL_CALL_END` / `TOOL_CALL_RESULT` | un seul `tool` : `running` au START, mis à jour `ok` au RESULT |
| `TEXT_MESSAGE_START` … `END` | un `message`, `title` = 140 premiers caractères (privé), `public_title` = « répond » |
| `STEP_STARTED` / `STEP_FINISHED` | `note` |
| `STATE_SNAPSHOT` / `STATE_DELTA` | ignorés (pas un fait à montrer) |

### 6.4 Zelij Core (`core/aquarium.py`, `etat.evenements`)
| type Core | Wakil Event |
|---|---|
| `execution` (statut en_cours / ok / échec) | `run.start` + `run.end` |
| `outil` | `tool` |
| `decision` | `decision.open`, target = fondateur |
| `decision_ceo` | `decision.made`, `status` approved / refused / changes |
| `echange` | `message` |
Le mode public actuel de Zelij Core (titres seulement) devient `public_title`.

### 6.5 Plateforme de l'éditeur (zelij.ai)
| événement de la plateforme | Wakil Event |
|---|---|
| `msg` (from, to[], channel, text) | `message`, `attrs.channel` |
| `run` (agent, status, task) | `run.start` / `run.end` selon `status` |
| `decision` (state) | `decision.open` si PENDING, `decision.made` sinon |
| `launch` (product) | `launch` |

### 6.6 Connecteur zelij.ai (agents des plateformes : Muse, dots)
| Fait du connecteur | Wakil Event |
|---|---|
| lecture du catalogue par un agent identifié | `visitor`, actor `{kind: visitor, name: "agent Muse"}`, `public_title` = « un visiteur consulte le catalogue » |
| demande de devis reçue | `visitor` puis `decision.open` vers le fondateur (le dossier humain) |
| commande confirmée par le paiement | `visitor` `status ok`, `public_title` = « une commande confirmée » |

## 7. Exemple (journée fictive de la maquette, extrait)

```
{"v":"0.1","ts":"2026-10-19T09:02:00+02:00","kind":"message","actor":{"id":"fondateur","name":"Vous","kind":"human","lane":"direction"},"target":{"id":"chef"},"title":"Il nous faut une page d'offre pour le salon de novembre.","public_title":"une demande au bureau"}
{"v":"0.1","ts":"2026-10-19T09:41:00+02:00","kind":"run.end","actor":{"id":"croissance","name":"Élise Tanguy","role":"marketing","lane":"marketing"},"status":"ok","title":"Brouillon prêt : trois faits relevés, chacun avec sa source.","cost":{"amount":0.42,"currency":"EUR","tokens_in":18400,"tokens_out":2200,"model":"claude-sonnet-5-5"}}
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ? Options, risques et retour arrière dans le paquet.","public_title":"propose une décision","status":"pending"}
{"v":"0.1","ts":"2026-10-19T10:12:00+02:00","kind":"decision.made","actor":{"id":"fondateur","kind":"human"},"target":{"id":"chef"},"status":"approved","title":"Approuvé, avec une consigne : ajouter la date du salon."}
{"v":"0.1","ts":"2026-10-19T15:03:00+02:00","kind":"visitor","actor":{"id":"muse-1","name":"agent Muse","kind":"visitor","lane":"entree"},"title":"Lecture du catalogue, demande de devis « refonte de site »","public_title":"un visiteur consulte le catalogue","source":"connecteur"}
```

## 8. Ce que le format refuse
Pas de contenu de prompt, pas de secret, pas d'adresse personnelle d'un visiteur (un `visitor` est anonyme par défaut), pas de champ « score » d'un humain. Un collecteur Wakilarium n'appelle jamais une adresse privée ou de boucle locale depuis un événement reçu, et n'exécute rien : il range et il montre.

## 9. Questions ouvertes (relecture)
1. Nom de l'acteur humain par défaut : « Vous » / « You » (comme l'aquarium) ou le prénom configuré ?
2. Le coût total public (`public_cost`) : interdit par défaut, c'est mon choix ; confirmer.
3. Conserver `note` (bruit possible) ou l'écarter de la v0.1.
