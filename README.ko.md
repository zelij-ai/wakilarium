# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · **한국어** · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![Wakilarium 장면: 금색의 인간, 레인마다 에이전트 하나, 입구의 방문자 한 명; 대화 카드와 그 연결선이 그들 사이를 헤엄친다](docs/img/wakilarium.gif)

*시뮬레이션된 하루, 가상의 인물: `demo/index.html` 목업, 야간 테마입니다. [고해상도 정지 이미지](docs/img/wakilarium-hero.png).*

**에이전트가 일하는 모습을 지켜보세요.** Wakilarium은 개방형 이벤트 형식인 *Wakil Event*와, 어떤 AI 에이전트든 무대에 올리는 의존성 없는 웹 컴포넌트입니다. 직무별 레인, 에이전트마다 고리 하나, 금색의 인간, 점선의 방문자, 눈앞에서 헤엄치는 대화와 결정. 실시간으로, 그리고 24시간 리플레이로. 공개 페이지는 내부 세부 사항 없이 같은 장면을 보여줍니다.

「Wakil」(وكيل)은 수임인, 즉 다른 사람을 대신해 행동하는 이를 뜻하고, 「-arium」은 그것을 관찰하는 장소입니다.

> 2026-10-19 기준 상태: **0차 묶음**. v0.1 형식, 스키마, 인터랙티브 목업이 검토용으로 여기에 공개되어 있습니다. 컴포넌트, 수집기, 어댑터는 1차 묶음에서 나옵니다. 아직 설치할 수 있는 것은 없습니다.

## 목업 보기

브라우저에서 `demo/index.html`을 여세요(또는 `demo/` 폴더를 서빙하세요). 가상의 하루가 재생됩니다: 시계, 속도, 타임라인, 오늘의 비용, 대기 중인 결정, 「공개 보기」 스위치, 야간과 주간 테마, 프랑스어와 영어. 네트워크 요청은 없습니다: 모든 것이 페이지 안에 있습니다.

## 한 줄로 보는 형식

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

열 가지 이벤트 종류(`run.start`, `run.end`, `tool`, `message`, `decision.open`, `decision.made`, `visitor`, `launch`, `cost`, `note`), 레인을 가진 행위자, 그리고 하나의 규칙: **비공개인 것은 비공개로 남는다**. `title`, `detail`, `attrs`, `cost`는 공개 보기에 절대 나오지 않으며, `public_title`(또는 일반 라벨)만 표시될 수 있습니다. 전체 명세: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md)(프랑스어) · 스키마: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## 로드맵

| 묶음 | 내용 |
|---|---|
| 0 | 이름, v0.1 형식, 스키마, 목업(오늘의 이 저장소) |
| 1 | `<wakil-arium>` 컴포넌트(Canvas 2D, ESM + IIFE, npm과 CDN), `wakil-collect` 수집기(Python: `POST /events`, 파일 추적, OTLP/HTTP, SQLite, `GET /state`, 토큰 기반 공개 페이지, `demo`), Claude Code 훅 어댑터, 호스팅된 데모 |
| 2 | OpenTelemetry GenAI / OpenInference, AG-UI, 쇼핑 에이전트 어댑터; Zelij Core와 발행사 플랫폼의 아쿠아리움을 회귀 없이 컴포넌트로 전환 |

대응표(Claude Code, OpenTelemetry, AG-UI, Zelij Core…)는 이미 명세에 들어 있습니다. 코드에 앞서 검토와 어댑터 기여를 환영합니다.

## Wakilarium이 절대 하지 않는 것

프롬프트나 모델 응답의 내용을 복사하는 것, 공개 페이지에 비공개 세부 사항을 표시하는 것, 수신한 이벤트로부터 사설 주소를 호출하는 것, 무엇이든 실행하는 것. 저장하고 보여줄 뿐입니다.

## 라이선스

Apache 2.0. [Zelij Core](https://github.com/zelij-ai/zelij-core)의 아쿠아리움에서 태어난 [zelij.ai](https://zelij.ai/) 프로젝트입니다.
