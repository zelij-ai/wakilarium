# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · **日本語** · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![Wakilarium のシーン：金色の人間、レーンごとに 1 人のエージェント、入口に 1 人の訪問者。対話カードとそのリンクが彼らの間を泳ぐ](docs/img/wakilarium.gif)

*シミュレートされた一日、架空の人物：これは `demo/index.html` のモックアップ、ナイトテーマです。[高解像度の静止画](docs/img/wakilarium-hero.png)。*

**エージェントが働く様子を眺めよう。** Wakilarium はオープンなイベント形式 *Wakil Event* と、依存ゼロのウェブコンポーネントで、あらゆる AI エージェントを舞台に上げます。職種ごとのレーン、エージェントごとのリング、金色の人間、点線の訪問者、目の前を泳ぐやり取りと決定。ライブでも、24 時間のリプレイでも。公開ページは内部の詳細を一切含まずに同じシーンを見せます。

「Wakil」（وكيل）は受任者、つまり他者に代わって行動する者。「-arium」はそれを観察する場所です。

> 2026-10-19 時点の状態：**ロット 0**。v0.1 形式、そのスキーマ、インタラクティブなモックアップをレビュー用にここで公開しています。コンポーネント、コレクター、アダプターはロット 1 で届きます。まだ何もインストールできません。

## モックアップを見る

ブラウザで `demo/index.html` を開きます（または `demo/` フォルダを配信します）。架空の一日が再生されます：時計、速度、タイムライン、当日のコスト、保留中の決定、「公開ビュー」スイッチ、ナイトとデイのテーマ、フランス語と英語。ネットワーク要求はなし：すべてページの中にあります。

## 一行でわかる形式

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

10 種類のイベント（`run.start`、`run.end`、`tool`、`message`、`decision.open`、`decision.made`、`visitor`、`launch`、`cost`、`note`）、レーンを持つアクター、そしてひとつのルール：**私的なものは私的なまま**。`title`、`detail`、`attrs`、`cost` は公開ビューに決して出ません。表示できるのは `public_title`（または汎用ラベル）だけです。完全な仕様：[`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md)（フランス語）· スキーマ：[`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json)。

## ロードマップ

| ロット | 内容 |
|---|---|
| 0 | 名前、v0.1 形式、スキーマ、モックアップ（今日のこのリポジトリ） |
| 1 | `<wakil-arium>` コンポーネント（Canvas 2D、ESM + IIFE、npm と CDN）、`wakil-collect` コレクター（Python：`POST /events`、ファイル追尾、OTLP/HTTP、SQLite、`GET /state`、トークンによる公開ページ、`demo`）、Claude Code フックアダプター、ホスト型デモ |
| 2 | OpenTelemetry GenAI / OpenInference、AG-UI、ショッピングエージェントのアダプター。Zelij Core と発行者プラットフォームのアクアリウムをリグレッションなしでこのコンポーネントへ切り替え |

対応表（Claude Code、OpenTelemetry、AG-UI、Zelij Core…）はすでに仕様の中にあります。コードの前に、レビューとアダプターの貢献を歓迎します。

## Wakilarium が決してしないこと

プロンプトやモデルの回答の内容をコピーすること。公開ページに私的な詳細を表示すること。受け取ったイベントからプライベートなアドレスを呼び出すこと。何かを実行すること。保管して、見せる。それだけです。

## ライセンス

Apache 2.0。[zelij.ai](https://zelij.ai/) のプロジェクトで、[Zelij Core](https://github.com/zelij-ai/zelij-core) のアクアリウムから生まれました。
