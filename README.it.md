# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · **Italiano** · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![La scena Wakilarium: l'umano in oro, un agente per corsia, un visitatore all'ingresso; una scheda di dialogo e il suo legame nuotano tra loro](docs/img/wakilarium.gif)

*Giornata simulata, personaggi di fantasia: è il mockup `demo/index.html`, tema notte. [Immagine fissa in alta definizione](docs/img/wakilarium-hero.png).*

**Guarda i tuoi agenti lavorare.** Wakilarium è un formato di evento aperto, il *Wakil Event*, e un componente web senza dipendenze che mette in scena qualsiasi agente IA: corsie per mestiere, un anello per agente, l'umano in oro, i visitatori tratteggiati, gli scambi e le decisioni che nuotano sotto i tuoi occhi, in diretta e in replay su ventiquattro ore. Una pagina pubblica mostra la stessa scena senza alcun dettaglio interno.

«Wakil» (وكيل) è il mandatario, colui che agisce per conto di un altro; «-arium», il luogo dove lo si osserva.

> Stato al 19/10/2026: **lotto 0**. Il formato v0.1, il suo schema e un mockup interattivo sono pubblicati qui per la revisione. Il componente, il collettore e gli adattatori arrivano con il lotto 1. Nulla è ancora installabile.

## Vedere il mockup

Apri `demo/index.html` in un browser (o servi la cartella `demo/`). Una giornata di fantasia viene riprodotta: orologio, velocità, linea del tempo, costo del giorno, decisioni in attesa, interruttore «vista pubblica», temi notte e giorno, francese e inglese. Nessuna richiesta di rete: è tutto nella pagina.

## Il formato in una riga

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

Dieci nature di evento (`run.start`, `run.end`, `tool`, `message`, `decision.open`, `decision.made`, `visitor`, `launch`, `cost`, `note`), un attore con la sua corsia e una regola: **ciò che è privato resta privato**. `title`, `detail`, `attrs` e `cost` non escono mai su una vista pubblica; solo `public_title` (o un'etichetta generica) può comparire. Specifica completa: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) (in francese) · schema: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## Cosa è previsto

| Lotto | Contenuto |
|---|---|
| 0 | nome, formato v0.1, schema, mockup (questo repository oggi) |
| 1 | componente `<wakil-arium>` (Canvas 2D, ESM + IIFE, npm e CDN), collettore `wakil-collect` (Python: `POST /events`, tail di file, OTLP/HTTP, SQLite, `GET /state`, pagina pubblica per token, `demo`), adattatore per gli hook di Claude Code, demo ospitata |
| 2 | adattatori OpenTelemetry GenAI / OpenInference, AG-UI, connettori per agenti d'acquisto; passaggio degli acquari di Zelij Core e della piattaforma dell'editore al componente, senza regressioni |

Le tabelle di corrispondenza (Claude Code, OpenTelemetry, AG-UI, Zelij Core…) sono già nella specifica: revisioni e contributi di adattatori sono benvenuti prima del codice.

## Cosa Wakilarium non farà mai

Copiare il contenuto di un prompt o di una risposta; mostrare un dettaglio privato su una pagina pubblica; chiamare un indirizzo privato a partire da un evento ricevuto; eseguire alcunché. Conserva e mostra.

## Licenza

Apache 2.0. Un progetto di [zelij.ai](https://zelij.ai/), nato dall'acquario di [Zelij Core](https://github.com/zelij-ai/zelij-core).
