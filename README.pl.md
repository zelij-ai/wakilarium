# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · **Polski** · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![Scena Wakilarium: człowiek w złocie, jeden agent na tor, gość przy wejściu; karta dialogu i jej połączenie płyną między nimi](docs/img/wakilarium.gif)

*Symulowany dzień, postacie fikcyjne: to makieta `demo/index.html`, motyw nocny. [Nieruchomy obraz w wysokiej rozdzielczości](docs/img/wakilarium-hero.png).*

**Patrz, jak pracują Twoi agenci.** Wakilarium to otwarty format zdarzeń, *Wakil Event*, oraz komponent webowy bez zależności, który wystawia na scenę dowolnego agenta AI: tory według zawodu, jeden pierścień na agenta, człowiek w złocie, goście kropkowani, wymiany i decyzje płynące na Twoich oczach, na żywo i w odtworzeniu z dwudziestu czterech godzin. Publiczna strona pokazuje tę samą scenę bez żadnego wewnętrznego szczegółu.

„Wakil” (وكيل) to pełnomocnik, ten, kto działa w imieniu innego; „-arium” to miejsce, w którym się go obserwuje.

> Stan na 19.10.2026: **partia 0**. Format v0.1, jego schemat i interaktywna makieta są tu opublikowane do przeglądu. Komponent, kolektor i adaptery przyjdą z partią 1. Nic nie jest jeszcze instalowalne.

## Zobacz makietę

Otwórz `demo/index.html` w przeglądarce (albo serwuj folder `demo/`). Odtwarza się fikcyjny dzień: zegar, prędkość, oś czasu, koszt dnia, oczekujące decyzje, przełącznik „widok publiczny”, motywy nocny i dzienny, francuski i angielski. Żadnego żądania sieciowego: wszystko jest w stronie.

## Format w jednej linii

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

Dziesięć rodzajów zdarzeń (`run.start`, `run.end`, `tool`, `message`, `decision.open`, `decision.made`, `visitor`, `launch`, `cost`, `note`), aktor ze swoim torem i jedna zasada: **co prywatne, pozostaje prywatne**. `title`, `detail`, `attrs` i `cost` nigdy nie trafiają do widoku publicznego; pokazać można tylko `public_title` (albo etykietę ogólną). Pełna specyfikacja: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) (po francusku) · schemat: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## Co jest planowane

| Partia | Zawartość |
|---|---|
| 0 | nazwa, format v0.1, schemat, makieta (to repozytorium dzisiaj) |
| 1 | komponent `<wakil-arium>` (Canvas 2D, ESM + IIFE, npm i CDN), kolektor `wakil-collect` (Python: `POST /events`, śledzenie pliku, OTLP/HTTP, SQLite, `GET /state`, strona publiczna po tokenie, `demo`), adapter hooków Claude Code, hostowane demo |
| 2 | adaptery OpenTelemetry GenAI / OpenInference, AG-UI, łączniki agentów zakupowych; przełączenie akwariów Zelij Core i platformy wydawcy na komponent, bez regresji |

Tabele odwzorowań (Claude Code, OpenTelemetry, AG-UI, Zelij Core…) są już w specyfikacji: przeglądy i wkład w adaptery mile widziane jeszcze przed kodem.

## Czego Wakilarium nigdy nie zrobi

Nie skopiuje treści promptu ani odpowiedzi modelu; nie pokaże prywatnego szczegółu na stronie publicznej; nie wywoła prywatnego adresu na podstawie odebranego zdarzenia; niczego nie wykona. Przechowuje i pokazuje.

## Licencja

Apache 2.0. Projekt [zelij.ai](https://zelij.ai/), zrodzony z akwarium [Zelij Core](https://github.com/zelij-ai/zelij-core).
