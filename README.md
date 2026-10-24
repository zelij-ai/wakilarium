# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · **Français** · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![La scène Wakilarium : l'humain en or, un agent par couloir, un visiteur à l'entrée ; une carte de dialogue et son lien nagent entre eux](docs/img/wakilarium.gif)

*Journée simulée, personnages fictifs : c'est la maquette `demo/index.html`, thème nuit. [Image fixe en haute définition](docs/img/wakilarium-hero.png).*

**Regardez vos agents travailler.** Wakilarium est un format d'événement ouvert, le *Wakil Event*, et un composant web sans dépendance qui met en scène n'importe quel agent d'IA : couloirs par métier, un anneau par agent, l'humain en or, les visiteurs en pointillé, les échanges et les décisions qui nagent sous vos yeux, en direct et en replay sur vingt-quatre heures. Une page publique montre la même scène sans aucun détail interne.

« Wakil » (وكيل) est le mandataire, celui qui agit au nom d'un autre ; « -arium », le lieu où on l'observe.

> État au 25/10/2026 : **lot 1, première livraison**. Le collecteur local, le hook Claude Code, le composant `<wakil-arium>`, la page publique et le badge sont installables (`npx wakilarium`). Restent au lot 1 : le replay partageable en vidéo, puis les adaptateurs OpenTelemetry / AG-UI au lot 2.

## Essayer en une minute : vos propres agents

```bash
npx wakilarium
```

Le collecteur écoute sur `http://127.0.0.1:8798`, la page s'ouvre, et Wakilarium propose d'installer le hook Claude Code dans
`~/.claude/settings.json` (une sauvegarde est faite à côté ; `--yes` pour accepter sans question, `--no-hooks` pour s'en passer).
Dès la première commande de Claude Code, la session apparaît dans son couloir : chaque outil est une étincelle, chaque réponse
une carte, chaque demande de l'humain un échange vers l'agent. Rien ne quitte la machine : les événements sont écrits dans
`~/.wakilarium/events.ndjson`, l'adaptateur ne lit que les champs du hook, jamais vos fichiers.

- `npx wakilarium demo` : la journée fictive, sans rien installer.
- `npx wakilarium install-hooks` / `uninstall-hooks` : poser ou retirer le hook à la main.
- Page publique `http://127.0.0.1:8798/public/<jeton>/` (titres publics seulement, sans coût ni détail) et badge SVG
  `http://127.0.0.1:8798/badge.svg` pour un README ; `/export.wakil` exporte la journée en NDJSON.
- Pour tout autre agent : `POST http://127.0.0.1:8798/events` avec des Wakil Events (tableau JSON ou NDJSON), `GET /state?hours=24`,
  flux SSE sur `/stream`. Le composant seul : `<script type="module" src="/wakilarium.js"></script>` puis
  `<wakil-arium src="/state" live theme="night" lang="fr"></wakil-arium>`.

## Voir la maquette

Ouvrez `demo/index.html` dans un navigateur (ou servez le dossier `demo/`). Une journée fictive se rejoue : horloge, vitesse, ligne de temps, coût du jour, décisions en attente, case « vue publique », thèmes nuit et jour, français et anglais. Aucune requête réseau : tout est dans la page.

## Le format en une ligne

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

Dix natures d'événement (`run.start`, `run.end`, `tool`, `message`, `decision.open`, `decision.made`, `visitor`, `launch`, `cost`, `note`), un acteur avec son couloir, et une règle : **ce qui est privé le reste**. `title`, `detail`, `attrs` et `cost` ne sortent jamais sur une vue publique ; seul `public_title` (ou un libellé générique) peut s'afficher. Spécification complète : [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) · schéma : [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## Ce qui est prévu

| Lot | Contenu |
|---|---|
| 0 | nom, format v0.1, schéma, maquette (ce dépôt aujourd'hui) |
| 1 | **livré le 25/10** : composant `<wakil-arium>` (Canvas 2D, ESM, zéro dépendance), collecteur local en Node (`POST /events`, NDJSON sur disque, `GET /state`, `/stream` SSE, page publique par jeton, badge SVG, export), adaptateur hooks Claude Code, `npx wakilarium` ; **à venir** : replay partagé en vidéo, publication npm, démo hébergée |
| 2 | adaptateurs OpenTelemetry GenAI / OpenInference, AG-UI, connecteurs d'agents d'achat ; bascule des aquariums de Zelij Core et de la plateforme de l'éditeur, sans régression |

Les tables de correspondance (Claude Code, OpenTelemetry, AG-UI, Zelij Core…) sont déjà dans la spécification : les relectures et contributions d'adaptateurs sont bienvenues avant le code.

## Ce que Wakilarium ne fera jamais

Copier le contenu d'un prompt ou d'une réponse ; afficher un détail privé sur une page publique ; appeler une adresse privée depuis un événement reçu ; exécuter quoi que ce soit. Il range et il montre.

## Licence

Apache 2.0. Un projet de [zelij.ai](https://zelij.ai/), né de l'aquarium de [Zelij Core](https://github.com/zelij-ai/zelij-core).
