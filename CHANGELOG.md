# Journal des versions

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
