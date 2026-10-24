# Wakilarium

[English](README.en.md) · **简体中文** · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![Wakilarium 场景：金色的人类，每条泳道一个智能体，入口处一位访客；一张对话卡片和它的连线在他们之间游动](docs/img/wakilarium.gif)

*模拟的一天，虚构人物：这是 `demo/index.html` 的样稿，夜间主题。[高清静态图](docs/img/wakilarium-hero.png)。*

**看着你的智能体工作。** Wakilarium 是一种开放的事件格式——*Wakil Event*——以及一个零依赖的 Web 组件，可以把任何 AI 智能体搬上舞台：按职能划分的泳道、每个智能体一个圆环、金色的人类、虚线表示的访客，交流和决策在你眼前游动，实时呈现，并可回放二十四小时。公开页面展示同一场景，但不含任何内部细节。

「Wakil」（وكيل）是受托人，即代他人行事的人；「-arium」则是观察它的地方。

> 截至 2026-10-19 的状态：**第 0 批**。v0.1 格式、其模式（schema）和一个交互式样稿已在此发布以供评审。组件、收集器和适配器将随第 1 批到来。目前还没有任何东西可以安装。

## 查看样稿

在浏览器中打开 `demo/index.html`（或直接托管 `demo/` 目录）。一个虚构的一天会重放：时钟、速度、时间线、当日成本、待处理的决策、「公开视图」开关、夜间与日间主题、法语与英语。没有任何网络请求：一切都在页面里。

## 一行看懂格式

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

十种事件类型（`run.start`、`run.end`、`tool`、`message`、`decision.open`、`decision.made`、`visitor`、`launch`、`cost`、`note`），一个带泳道的执行者，以及一条规则：**私有的东西保持私有**。`title`、`detail`、`attrs` 和 `cost` 永远不会出现在公开视图上；只有 `public_title`（或一个通用标签）可以显示。完整规范：[`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md)（法语）· 模式：[`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json)。

## 路线图

| 批次 | 内容 |
|---|---|
| 0 | 名称、v0.1 格式、模式、样稿（今天的这个仓库） |
| 1 | `<wakil-arium>` 组件（Canvas 2D，ESM + IIFE，npm 与 CDN）、`wakil-collect` 收集器（Python：`POST /events`、文件跟踪、OTLP/HTTP、SQLite、`GET /state`、按令牌访问的公开页面、`demo`）、Claude Code 钩子适配器、托管演示 |
| 2 | OpenTelemetry GenAI / OpenInference、AG-UI 和购物智能体适配器；将 Zelij Core 和发行方平台的水族箱切换到该组件，且无回归 |

映射表（Claude Code、OpenTelemetry、AG-UI、Zelij Core……）已在规范中：欢迎在写代码之前先评审并贡献适配器。

## Wakilarium 永远不会做的事

复制提示词或模型回答的内容；在公开页面上显示私有细节；根据收到的事件去调用私有地址；执行任何东西。它只负责存放和展示。

## 许可证

Apache 2.0。一个 [zelij.ai](https://zelij.ai/) 项目，源自 [Zelij Core](https://github.com/zelij-ai/zelij-core) 的水族箱。
