# Wakilarium

**English** · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![The Wakilarium scene: the human in gold, one agent per lane, a visitor at the entrance; a dialogue card and its link swim between them](docs/img/wakilarium.gif)

*Simulated day, fictional characters: this is the `demo/index.html` mockup, night theme. [Still image in high definition](docs/img/wakilarium-hero.png).*

**Watch your agents work.** Wakilarium is an open event format, the *Wakil Event*, and a dependency-free web component that stages any AI agent: lanes by job, one ring per agent, the human in gold, visitors dashed, exchanges and decisions swimming before your eyes, live and in replay over twenty-four hours. A public page shows the same scene without any internal detail.

*Wakil* (وكيل) is the mandatary, the one who acts on someone's behalf; *-arium*, the place where you watch it.

> Status on 2026-10-25: **lot 1, first delivery**. The local collector, the Claude Code hook, the `<wakil-arium>` component, the public page and the badge are installable (`npx wakilarium`). Still in lot 1: the shareable video replay; then the OpenTelemetry / AG-UI adapters in lot 2.

## Try it in one minute: your own agents

```bash
npx wakilarium
```

The collector listens on `http://127.0.0.1:8798`, the page opens, and Wakilarium offers to install the Claude Code hook in
`~/.claude/settings.json` (a backup is kept next to it; `--yes` to accept without asking, `--no-hooks` to skip). From the first
Claude Code command, the session appears in its lane: every tool is a spark, every answer a card, every human request an
exchange towards the agent. Nothing leaves the machine: events are written to `~/.wakilarium/events.ndjson`, and the adapter only
reads the hook's fields, never your files.

- `npx wakilarium demo`: the fictional day, nothing installed.
- `npx wakilarium install-hooks` / `uninstall-hooks`: add or remove the hook by hand.
- Public page `http://127.0.0.1:8798/public/<token>/` (public titles only, no cost, no detail) and an SVG badge at
  `http://127.0.0.1:8798/badge.svg` for a README; `/export.wakil` exports the day as NDJSON.
- Any other agent: `POST http://127.0.0.1:8798/events` with Wakil Events (JSON array or NDJSON), `GET /state?hours=24`, SSE on
  `/stream`. The component alone: `<script type="module" src="/wakilarium.js"></script>` then
  `<wakil-arium src="/state" live theme="night" lang="en"></wakil-arium>`.

## See the mockup

Open `demo/index.html` in a browser (or serve the `demo/` folder). A fictional day replays: clock, speed, timeline, today's cost, pending decisions, a "public view" switch, night and day themes, French and English. No network request: everything is in the page.

## The format in one line

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

Ten event kinds (`run.start`, `run.end`, `tool`, `message`, `decision.open`, `decision.made`, `visitor`, `launch`, `cost`, `note`), an actor with its lane, and one rule: **what is private stays private**. `title`, `detail`, `attrs` and `cost` never reach a public view; only `public_title` (or a generic label) may be shown. Full specification: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) (in French; English translation planned for lot 1) · schema: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## Roadmap

| Lot | Content |
|---|---|
| 0 | name, v0.1 format, schema, mockup (this repository today) |
| 1 | **shipped 2026-10-25**: `<wakil-arium>` component (Canvas 2D, ESM, zero dependency), local collector in Node (`POST /events`, NDJSON on disk, `GET /state`, SSE `/stream`, public page by token, SVG badge, export), Claude Code hooks adapter, `npx wakilarium`; **next**: shared video replay, npm publication, hosted demo |
| 2 | OpenTelemetry GenAI / OpenInference, AG-UI and shopping-agent adapters; switching the aquariums of Zelij Core and of the publisher's platform to the component, with no regression |

The mapping tables (Claude Code, OpenTelemetry, AG-UI, Zelij Core…) are already in the specification: reviews and adapter contributions are welcome before the code.

## What Wakilarium will never do

Copy a prompt or a model answer; show a private detail on a public page; call a private address from a received event; execute anything. It stores and it shows.

## License

Apache 2.0. A [zelij.ai](https://zelij.ai/) project, born from the [Zelij Core](https://github.com/zelij-ai/zelij-core) aquarium.
