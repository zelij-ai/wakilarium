# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · **Roman Urdu** · [Română](README.ro.md)

![Wakilarium ka manzar: sunehre rang mein insaan, har lane mein ek agent, darwaze par ek visitor; ek guftagu card aur us ka rabta un ke darmiyan tairte hain](docs/img/wakilarium.gif)

*Simulated din, farzi kirdar: yeh `demo/index.html` ka mockup hai, raat ka theme. [High definition still image](docs/img/wakilarium-hero.png).*

**Apne agents ko kaam karte dekhein.** Wakilarium ek khula event format hai, *Wakil Event*, aur ek dependency-free web component jo kisi bhi AI agent ko stage par le aata hai: pesha ke mutabiq lanes, har agent ke liye ek ring, sunehre rang mein insaan, dotted visitors, aap ki aankhon ke saamne tairte hue tabadle aur faisle, live aur chaubees ghante ke replay mein. Ek awami page wahi manzar bina kisi andaruni tafseel ke dikhata hai.

«Wakil» (وكيل) woh numainda hai jo kisi aur ki taraf se amal karta hai; «-arium» woh jagah hai jahan use dekha jata hai.

> 19/10/2026 ki soorat-e-haal: **lot 0**. Format v0.1, us ka schema aur ek interactive mockup yahan nazar-e-sani ke liye shaya kiye gaye hain. Component, collector aur adapters lot 1 mein aayenge. Abhi kuch install nahi hota.

## Mockup dekhein

Browser mein `demo/index.html` kholein (ya `demo/` folder serve karein). Ek farzi din replay hota hai: ghari, raftaar, timeline, din ki laagat, intezar mein faisle, «awami view» ka switch, raat aur din ke themes, French aur English. Koi network request nahi: sab kuch page ke andar hai.

## Format ek line mein

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

Das qisam ke events (`run.start`, `run.end`, `tool`, `message`, `decision.open`, `decision.made`, `visitor`, `launch`, `cost`, `note`), apni lane ke saath ek actor, aur ek qaida: **jo nijee hai woh nijee rehta hai**. `title`, `detail`, `attrs` aur `cost` kabhi awami view mein nahi aate; sirf `public_title` (ya ek aam label) dikhaya ja sakta hai. Mukammal specification: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) (French mein) · schema: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## Mansooba

| Lot | Mawad |
|---|---|
| 0 | naam, format v0.1, schema, mockup (aaj yeh repository) |
| 1 | `<wakil-arium>` component (Canvas 2D, ESM + IIFE, npm aur CDN), `wakil-collect` collector (Python: `POST /events`, file tail, OTLP/HTTP, SQLite, `GET /state`, token se awami page, `demo`), Claude Code hooks adapter, hosted demo |
| 2 | OpenTelemetry GenAI / OpenInference, AG-UI aur shopping-agent adapters; Zelij Core aur publisher ke platform ke aquariums ko bina regression component par muntaqil karna |

Mapping tables (Claude Code, OpenTelemetry, AG-UI, Zelij Core…) pehle se specification mein hain: code se pehle reviews aur adapter contributions khush-aamdeed hain.

## Wakilarium kabhi kya nahi karega

Kisi prompt ya model ke jawab ka mawad copy karna; awami page par nijee tafseel dikhana; mosool shuda event se nijee address call karna; kuch bhi chalana. Woh rakhta hai aur dikhata hai.

## License

Apache 2.0. [zelij.ai](https://zelij.ai/) ka ek project, jo [Zelij Core](https://github.com/zelij-ai/zelij-core) ke aquarium se paida hua.
