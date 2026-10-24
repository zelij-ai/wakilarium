# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · **Deutsch** · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![Die Wakilarium-Szene: der Mensch in Gold, ein Agent pro Bahn, ein Besucher am Eingang; eine Dialogkarte und ihre Verbindung schwimmen zwischen ihnen](docs/img/wakilarium.gif)

*Simulierter Tag, fiktive Figuren: das ist der Entwurf `demo/index.html`, Nachtthema. [Standbild in hoher Auflösung](docs/img/wakilarium-hero.png).*

**Sehen Sie Ihren Agenten bei der Arbeit zu.** Wakilarium ist ein offenes Ereignisformat, das *Wakil Event*, und eine abhängigkeitsfreie Webkomponente, die jeden KI-Agenten in Szene setzt: Bahnen nach Beruf, ein Ring pro Agent, der Mensch in Gold, Besucher gepunktet, Austausch und Entscheidungen, die vor Ihren Augen schwimmen, live und als Wiedergabe über vierundzwanzig Stunden. Eine öffentliche Seite zeigt dieselbe Szene ohne jedes interne Detail.

„Wakil“ (وكيل) ist der Bevollmächtigte, der im Namen eines anderen handelt; „-arium“ der Ort, an dem man ihn beobachtet.

> Stand 19.10.2026: **Los 0**. Das Format v0.1, sein Schema und ein interaktiver Entwurf sind hier zur Durchsicht veröffentlicht. Komponente, Kollektor und Adapter kommen mit Los 1. Noch ist nichts installierbar.

## Den Entwurf ansehen

Öffnen Sie `demo/index.html` in einem Browser (oder liefern Sie den Ordner `demo/` aus). Ein fiktiver Tag wird abgespielt: Uhr, Geschwindigkeit, Zeitleiste, Tageskosten, offene Entscheidungen, Schalter „öffentliche Ansicht“, Nacht- und Tagthema, Französisch und Englisch. Keine Netzwerkanfrage: alles steckt in der Seite.

## Das Format in einer Zeile

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

Zehn Ereignisarten (`run.start`, `run.end`, `tool`, `message`, `decision.open`, `decision.made`, `visitor`, `launch`, `cost`, `note`), ein Akteur mit seiner Bahn und eine Regel: **Was privat ist, bleibt privat**. `title`, `detail`, `attrs` und `cost` gelangen nie in eine öffentliche Ansicht; nur `public_title` (oder eine generische Beschriftung) darf erscheinen. Vollständige Spezifikation: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) (auf Französisch) · Schema: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## Was geplant ist

| Los | Inhalt |
|---|---|
| 0 | Name, Format v0.1, Schema, Entwurf (dieses Repository heute) |
| 1 | Komponente `<wakil-arium>` (Canvas 2D, ESM + IIFE, npm und CDN), Kollektor `wakil-collect` (Python: `POST /events`, Dateiverfolgung, OTLP/HTTP, SQLite, `GET /state`, öffentliche Seite per Token, `demo`), Adapter für Claude-Code-Hooks, gehostete Demo |
| 2 | Adapter für OpenTelemetry GenAI / OpenInference, AG-UI, Konnektoren für Einkaufsagenten; Umstellung der Aquarien von Zelij Core und der Plattform des Herausgebers auf die Komponente, ohne Regression |

Die Zuordnungstabellen (Claude Code, OpenTelemetry, AG-UI, Zelij Core…) stehen bereits in der Spezifikation: Durchsichten und Adapter-Beiträge sind schon vor dem Code willkommen.

## Was Wakilarium niemals tun wird

Den Inhalt eines Prompts oder einer Antwort kopieren; ein privates Detail auf einer öffentlichen Seite zeigen; aus einem empfangenen Ereignis eine private Adresse aufrufen; irgendetwas ausführen. Es speichert und es zeigt.

## Lizenz

Apache 2.0. Ein Projekt von [zelij.ai](https://zelij.ai/), entstanden aus dem Aquarium von [Zelij Core](https://github.com/zelij-ai/zelij-core).
