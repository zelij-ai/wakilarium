# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · **Español** · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![La escena Wakilarium: el humano en oro, un agente por carril, un visitante en la entrada; una tarjeta de diálogo y su enlace nadan entre ellos](docs/img/wakilarium.gif)

*Jornada simulada, personajes ficticios: es la maqueta `demo/index.html`, tema noche. [Imagen fija en alta definición](docs/img/wakilarium-hero.png).*

**Mire trabajar a sus agentes.** Wakilarium es un formato de evento abierto, el *Wakil Event*, y un componente web sin dependencias que pone en escena cualquier agente de IA: carriles por oficio, un anillo por agente, el humano en oro, los visitantes en punteado, los intercambios y las decisiones que nadan ante sus ojos, en directo y en repetición durante veinticuatro horas. Una página pública muestra la misma escena sin ningún detalle interno.

«Wakil» (وكيل) es el mandatario, el que actúa en nombre de otro; «-arium», el lugar donde se le observa.

> Estado a 19/10/2026: **lote 0**. El formato v0.1, su esquema y una maqueta interactiva se publican aquí para revisión. El componente, el colector y los adaptadores llegan con el lote 1. Nada es instalable todavía.

## Ver la maqueta

Abra `demo/index.html` en un navegador (o sirva la carpeta `demo/`). Se reproduce una jornada ficticia: reloj, velocidad, línea de tiempo, coste del día, decisiones pendientes, casilla «vista pública», temas noche y día, francés e inglés. Ninguna petición de red: todo está en la página.

## El formato en una línea

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

Diez tipos de evento (`run.start`, `run.end`, `tool`, `message`, `decision.open`, `decision.made`, `visitor`, `launch`, `cost`, `note`), un actor con su carril y una regla: **lo privado sigue siendo privado**. `title`, `detail`, `attrs` y `cost` nunca salen en una vista pública; solo `public_title` (o una etiqueta genérica) puede mostrarse. Especificación completa: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) (en francés) · esquema: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## Lo que está previsto

| Lote | Contenido |
|---|---|
| 0 | nombre, formato v0.1, esquema, maqueta (este repositorio hoy) |
| 1 | componente `<wakil-arium>` (Canvas 2D, ESM + IIFE, npm y CDN), colector `wakil-collect` (Python: `POST /events`, seguimiento de fichero, OTLP/HTTP, SQLite, `GET /state`, página pública por token, `demo`), adaptador de hooks de Claude Code, demo alojada |
| 2 | adaptadores OpenTelemetry GenAI / OpenInference, AG-UI, conectores de agentes de compra; cambio de los acuarios de Zelij Core y de la plataforma del editor al componente, sin regresión |

Las tablas de correspondencia (Claude Code, OpenTelemetry, AG-UI, Zelij Core…) ya están en la especificación: las revisiones y las contribuciones de adaptadores son bienvenidas antes del código.

## Lo que Wakilarium nunca hará

Copiar el contenido de un prompt o de una respuesta; mostrar un detalle privado en una página pública; llamar a una dirección privada desde un evento recibido; ejecutar nada. Guarda y muestra.

## Licencia

Apache 2.0. Un proyecto de [zelij.ai](https://zelij.ai/), nacido del acuario de [Zelij Core](https://github.com/zelij-ai/zelij-core).
