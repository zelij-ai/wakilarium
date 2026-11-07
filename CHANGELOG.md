# Journal des versions

## 0.2.0 — à paraître (lot 2, première partie)

- **Adaptateur OpenTelemetry GenAI / OpenInference** (`src/otel.js`, spec §6.2) : le collecteur reçoit les traces OTLP/HTTP en
  JSON sur `POST /v1/traces` (`OTEL_EXPORTER_OTLP_PROTOCOL=http/json` ; le protobuf répond 415). `invoke_agent` → `run.start`
  + `run.end`, `execute_tool` → `tool`, `chat` / `generate_content` / `text_completion` → jetons et modèle sur le coût de
  l'exécution englobante, ou un `cost` isolé ; `gen_ai.provider.name` → `attrs.provider` ; `openinference.span.kind` reconnu.
  Montants d'après une table de tarifs datée (06/11/2026), complétable dans `~/.wakilarium/tarifs.json` ; un modèle inconnu
  n'est jamais chiffré. Aucun contenu de prompt ni de réponse copié.
- **Adaptateur AG-UI** (`src/agui.js`, spec §6.3) : `POST /agui` reçoit le flux tel quel (SSE, NDJSON ou tableau), avec l'état
  gardé entre les appels ; `npx wakilarium agui` lit le flux sur l'entrée standard (`curl -N … | npx wakilarium agui --agent
  "Nom"`). Les messages sont assemblés de START à END, un appel d'outil est un seul `tool` mis à jour au résultat sous le même
  identifiant, les étapes deviennent des `note`, les `STATE_*` et `MESSAGES_SNAPSHOT` sont ignorés, les arguments jamais copiés.
- Magasin : un événement renvoyé avec le même `id` remplace le précédent, en mémoire comme au rechargement du NDJSON (la
  dernière ligne écrite l'emporte).
- Collecteur : `/jeton` indique les adresses `/v1/traces` et `/agui` ; la bannière de démarrage les affiche.
- Démo en ligne sur wakilarium.zelij.ai : la page passe à la racine du dépôt (`index.html`, `demo/` redirige), textes au présent
  (collecteur `npx wakilarium`, lot 1 livré), description et titre de la page.
- Tests : `test/adaptateurs.test.js` (traces, OpenInference, tarifs, flux AG-UI, mise à jour par identifiant, routes).

## 0.1.1 — 2026-11-04

- Composant : la scène devient une eau vivante. Caustiques précalculées qui ondulent au fond, trois rayons tombés de la surface
  qui balancent, plancton en parallaxe, nappe de couleur au pied de chaque couloir ; les agents sont des orbes de verre éclairés
  de l'intérieur qui respirent, halo d'eau autour d'eux, ondes et satellites pendant le travail, bulles à chaque outil ; l'humain
  porte une couronne de rayons ; les fils coulent dans le sens de l'envoi avec une comète à traîne ; les cartes sont des plaques
  de verre avec ombre portée et liseré. Sous « moins de mouvement », la scène est fixe mais garde sa profondeur. En pause, la
  scène se fige (cartes et fils ne s'éteignent plus).
- Démo : `demo/index.html` utilise le composant du paquet (plus de second code de dessin, `demo/wakilarium.js` retiré) ; le
  thème et la langue de la page sont relayés au composant.
- README : image fixe, scène et GIF recapturés.

## 0.1.0 — 2026-10-25 (lot 1, première livraison)

- `packages/wakilarium` : paquet npm `wakilarium` (Node ≥ 18, zéro dépendance). `npx wakilarium` démarre le collecteur local
  (127.0.0.1:8798), propose d'installer le hook Claude Code avec sauvegarde de `~/.claude/settings.json`, ouvre la page.
- Collecteur : `POST /events` (tableau ou NDJSON, bornes de la spécification), `GET /state?hours=`, `/stream` (SSE),
  `/public/<jeton>` (vue publique : titres publics seulement, sans coût ni détail), `/badge.svg`, `/export.wakil`, page.
- Adaptateur Claude Code : SessionStart/End, UserPromptSubmit, PreToolUse, PostToolUse, Notification, Stop, SubagentStop → Wakil
  Events ; chemins masqués, aucun fichier lu, envoi borné à 300 ms, jamais bloquant.
- Composant `<wakil-arium>` : attributs `src`, `stream`, `theme`, `lang`, `hours`, `public`, `speed`, `live` ; replay et direct ;
  `prefers-reduced-motion` ; événement DOM `wakil:select`.
- Tests `node --test` (format, magasin, vue publique, hook, réglages, serveur, démo).

## 0.0.1 — 2026-10-19 (lot 0)

- Dépôt public ouvert sous licence Apache 2.0.
- Format **Wakil Event v0.1** : spécification (`docs/wakil-event-v0.1.md`) et schéma JSON (`schema/wakil-event-0.1.schema.json`) : dix natures, acteur avec couloir, séparation privé / public, transport, tables de correspondance pour les hooks Claude Code, OpenTelemetry GenAI / OpenInference, AG-UI, Zelij Core, la plateforme de l'éditeur et les connecteurs d'agents d'achat.
- **Maquette interactive** (`demo/`) : scène Canvas 2D sans dépendance, journée fictive rejouable, vue publique, thèmes nuit et jour, français et anglais. Rien n'est encore installable : le composant et le collecteur arrivent au lot 1.
