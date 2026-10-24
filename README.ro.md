# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · **Română**

![Scena Wakilarium: omul în auriu, un agent pe culoar, un vizitator la intrare; un card de dialog și legătura lui înoată între ei](docs/img/wakilarium.gif)

*Zi simulată, personaje fictive: este macheta `demo/index.html`, tema de noapte. [Imagine fixă în înaltă definiție](docs/img/wakilarium-hero.png).*

**Privește-ți agenții lucrând.** Wakilarium este un format de eveniment deschis, *Wakil Event*, și o componentă web fără dependențe care pune în scenă orice agent IA: culoare pe meserii, un inel per agent, omul în auriu, vizitatorii punctați, schimburile și deciziile care înoată sub ochii tăi, în direct și în redare pe douăzeci și patru de ore. O pagină publică arată aceeași scenă fără niciun detaliu intern.

„Wakil” (وكيل) este mandatarul, cel care acționează în numele altuia; „-arium”, locul unde îl observi.

> Stare la 19/10/2026: **lotul 0**. Formatul v0.1, schema lui și o machetă interactivă sunt publicate aici pentru recenzie. Componenta, colectorul și adaptoarele vin cu lotul 1. Nimic nu este încă instalabil.

## Vezi macheta

Deschide `demo/index.html` într-un browser (sau servește dosarul `demo/`). O zi fictivă se redă: ceas, viteză, linie de timp, costul zilei, decizii în așteptare, comutator „vedere publică”, teme de noapte și de zi, franceză și engleză. Nicio cerere de rețea: totul este în pagină.

## Formatul într-o linie

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

Zece tipuri de evenimente (`run.start`, `run.end`, `tool`, `message`, `decision.open`, `decision.made`, `visitor`, `launch`, `cost`, `note`), un actor cu culoarul său și o regulă: **ce este privat rămâne privat**. `title`, `detail`, `attrs` și `cost` nu ajung niciodată într-o vedere publică; doar `public_title` (sau o etichetă generică) poate fi afișat. Specificația completă: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) (în franceză) · schema: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## Ce este planificat

| Lot | Conținut |
|---|---|
| 0 | nume, format v0.1, schemă, machetă (acest depozit astăzi) |
| 1 | componenta `<wakil-arium>` (Canvas 2D, ESM + IIFE, npm și CDN), colectorul `wakil-collect` (Python: `POST /events`, urmărire de fișier, OTLP/HTTP, SQLite, `GET /state`, pagină publică prin token, `demo`), adaptor pentru hook-urile Claude Code, demo găzduit |
| 2 | adaptoare OpenTelemetry GenAI / OpenInference, AG-UI, conectori pentru agenți de cumpărături; trecerea acvariilor Zelij Core și ale platformei editorului la componentă, fără regresie |

Tabelele de corespondență (Claude Code, OpenTelemetry, AG-UI, Zelij Core…) sunt deja în specificație: recenziile și contribuțiile de adaptoare sunt binevenite înaintea codului.

## Ce nu va face niciodată Wakilarium

Să copieze conținutul unui prompt sau al unui răspuns; să arate un detaliu privat pe o pagină publică; să apeleze o adresă privată pornind de la un eveniment primit; să execute ceva. Păstrează și arată.

## Licență

Apache 2.0. Un proiect [zelij.ai](https://zelij.ai/), născut din acvariul [Zelij Core](https://github.com/zelij-ai/zelij-core).
