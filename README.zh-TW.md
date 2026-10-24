# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · **繁體中文** · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![Wakilarium 場景：金色的人類，每條泳道一個代理人，入口處一位訪客；一張對話卡片和它的連線在他們之間游動](docs/img/wakilarium.gif)

*模擬的一天，虛構人物：這是 `demo/index.html` 的樣稿，夜間主題。[高畫質靜態圖](docs/img/wakilarium-hero.png)。*

**看著你的代理人工作。** Wakilarium 是一種開放的事件格式——*Wakil Event*——以及一個零相依的 Web 元件，可以把任何 AI 代理人搬上舞台：依職能劃分的泳道、每個代理人一個圓環、金色的人類、虛線表示的訪客，交流與決策在你眼前游動，即時呈現，並可回放二十四小時。公開頁面展示同一場景，但不含任何內部細節。

「Wakil」（وكيل）是受託人，即代他人行事的人；「-arium」則是觀察它的地方。

> 截至 2026-10-19 的狀態：**第 0 批**。v0.1 格式、其綱要（schema）和一個互動式樣稿已在此發布以供評審。元件、收集器和轉接器將隨第 1 批到來。目前還沒有任何東西可以安裝。

## 查看樣稿

在瀏覽器中開啟 `demo/index.html`（或直接架設 `demo/` 目錄）。一個虛構的一天會重播：時鐘、速度、時間軸、當日成本、待處理的決策、「公開檢視」開關、夜間與日間主題、法語與英語。沒有任何網路請求：一切都在頁面裡。

## 一行看懂格式

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

十種事件類型（`run.start`、`run.end`、`tool`、`message`、`decision.open`、`decision.made`、`visitor`、`launch`、`cost`、`note`），一個帶泳道的行動者，以及一條規則：**私有的東西保持私有**。`title`、`detail`、`attrs` 和 `cost` 永遠不會出現在公開檢視上；只有 `public_title`（或一個通用標籤）可以顯示。完整規格：[`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md)（法語）· 綱要：[`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json)。

## 路線圖

| 批次 | 內容 |
|---|---|
| 0 | 名稱、v0.1 格式、綱要、樣稿（今天的這個儲存庫） |
| 1 | `<wakil-arium>` 元件（Canvas 2D，ESM + IIFE，npm 與 CDN）、`wakil-collect` 收集器（Python：`POST /events`、檔案追蹤、OTLP/HTTP、SQLite、`GET /state`、以權杖存取的公開頁面、`demo`）、Claude Code 掛鉤轉接器、託管示範 |
| 2 | OpenTelemetry GenAI / OpenInference、AG-UI 與購物代理人轉接器；將 Zelij Core 與發行者平台的水族箱切換到該元件，且無回歸 |

對應表（Claude Code、OpenTelemetry、AG-UI、Zelij Core……）已在規格中：歡迎在寫程式碼之前先評審並貢獻轉接器。

## Wakilarium 永遠不會做的事

複製提示詞或模型回答的內容；在公開頁面上顯示私有細節；根據收到的事件去呼叫私有位址；執行任何東西。它只負責存放和展示。

## 授權

Apache 2.0。一個 [zelij.ai](https://zelij.ai/) 專案，源自 [Zelij Core](https://github.com/zelij-ai/zelij-core) 的水族箱。
