# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · **Українська** · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![Сцена Wakilarium: людина в золоті, по одному агенту на доріжку, відвідувач біля входу; картка діалогу та її зв'язок пливуть між ними](docs/img/wakilarium.gif)

*Змодельований день, вигадані персонажі: це макет `demo/index.html`, нічна тема. [Нерухоме зображення у високій роздільності](docs/img/wakilarium-hero.png).*

**Дивіться, як працюють ваші агенти.** Wakilarium — це відкритий формат подій, *Wakil Event*, і вебкомпонент без залежностей, який виводить на сцену будь-якого ШІ-агента: доріжки за фахом, кільце на кожного агента, людина в золоті, відвідувачі пунктиром, обміни та рішення, що пливуть у вас перед очима, наживо і в повторі за двадцять чотири години. Публічна сторінка показує ту саму сцену без жодної внутрішньої деталі.

«Вакіль» (وكيل) — це повірений, той, хто діє від імені іншого; «-аріум» — місце, де за ним спостерігають.

> Стан на 19.10.2026: **лот 0**. Формат v0.1, його схема та інтерактивний макет опубліковані тут для рецензування. Компонент, колектор і адаптери прийдуть із лотом 1. Поки що нічого не можна встановити.

## Подивитися макет

Відкрийте `demo/index.html` у браузері (або роздайте теку `demo/`). Програється вигаданий день: годинник, швидкість, стрічка часу, вартість дня, рішення, що чекають, перемикач «публічний вигляд», нічна та денна теми, французька й англійська. Жодного мережевого запиту: все всередині сторінки.

## Формат одним рядком

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

Десять видів подій (`run.start`, `run.end`, `tool`, `message`, `decision.open`, `decision.made`, `visitor`, `launch`, `cost`, `note`), актор зі своєю доріжкою та одне правило: **приватне лишається приватним**. `title`, `detail`, `attrs` і `cost` ніколи не потрапляють у публічний вигляд; показуватися може лише `public_title` (або загальний підпис). Повна специфікація: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) (французькою) · схема: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## Що заплановано

| Лот | Зміст |
|---|---|
| 0 | назва, формат v0.1, схема, макет (цей репозиторій сьогодні) |
| 1 | компонент `<wakil-arium>` (Canvas 2D, ESM + IIFE, npm і CDN), колектор `wakil-collect` (Python: `POST /events`, стеження за файлом, OTLP/HTTP, SQLite, `GET /state`, публічна сторінка за токеном, `demo`), адаптер хуків Claude Code, розміщена демонстрація |
| 2 | адаптери OpenTelemetry GenAI / OpenInference, AG-UI, конектори агентів покупок; перехід акваріумів Zelij Core і платформи видавця на компонент без регресій |

Таблиці відповідності (Claude Code, OpenTelemetry, AG-UI, Zelij Core…) уже є в специфікації: рецензії та внески в адаптери вітаються ще до коду.

## Чого Wakilarium ніколи не робитиме

Копіювати вміст промпту чи відповіді моделі; показувати приватну деталь на публічній сторінці; звертатися до приватної адреси з отриманої події; будь-що виконувати. Він зберігає і показує.

## Ліцензія

Apache 2.0. Проєкт [zelij.ai](https://zelij.ai/), що народився з акваріума [Zelij Core](https://github.com/zelij-ai/zelij-core).
