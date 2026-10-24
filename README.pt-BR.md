# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · **Português (Brasil)** · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![A cena Wakilarium: o humano em dourado, um agente por raia, um visitante na entrada; um cartão de diálogo e seu vínculo nadam entre eles](docs/img/wakilarium.gif)

*Dia simulado, personagens fictícios: é a maquete `demo/index.html`, tema noite. [Imagem fixa em alta definição](docs/img/wakilarium-hero.png).*

**Veja seus agentes trabalhando.** Wakilarium é um formato de evento aberto, o *Wakil Event*, e um componente web sem dependências que põe em cena qualquer agente de IA: raias por função, um anel por agente, o humano em dourado, os visitantes pontilhados, as trocas e as decisões nadando diante dos seus olhos, ao vivo e em replay de vinte e quatro horas. Uma página pública mostra a mesma cena sem nenhum detalhe interno.

"Wakil" (وكيل) é o mandatário, aquele que age em nome de outro; "-arium", o lugar onde se observa.

> Situação em 19/10/2026: **lote 0**. O formato v0.1, seu esquema e uma maquete interativa estão publicados aqui para revisão. O componente, o coletor e os adaptadores chegam com o lote 1. Nada é instalável ainda.

## Ver a maquete

Abra `demo/index.html` em um navegador (ou sirva a pasta `demo/`). Um dia fictício é reproduzido: relógio, velocidade, linha do tempo, custo do dia, decisões pendentes, chave "visão pública", temas noite e dia, francês e inglês. Nenhuma requisição de rede: tudo está na página.

## O formato em uma linha

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

Dez tipos de evento (`run.start`, `run.end`, `tool`, `message`, `decision.open`, `decision.made`, `visitor`, `launch`, `cost`, `note`), um ator com sua raia e uma regra: **o que é privado continua privado**. `title`, `detail`, `attrs` e `cost` nunca saem em uma visão pública; só `public_title` (ou um rótulo genérico) pode aparecer. Especificação completa: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) (em francês) · esquema: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## O que está previsto

| Lote | Conteúdo |
|---|---|
| 0 | nome, formato v0.1, esquema, maquete (este repositório hoje) |
| 1 | componente `<wakil-arium>` (Canvas 2D, ESM + IIFE, npm e CDN), coletor `wakil-collect` (Python: `POST /events`, acompanhamento de arquivo, OTLP/HTTP, SQLite, `GET /state`, página pública por token, `demo`), adaptador de hooks do Claude Code, demo hospedada |
| 2 | adaptadores OpenTelemetry GenAI / OpenInference, AG-UI, conectores de agentes de compra; migração dos aquários do Zelij Core e da plataforma do editor para o componente, sem regressão |

As tabelas de correspondência (Claude Code, OpenTelemetry, AG-UI, Zelij Core…) já estão na especificação: revisões e contribuições de adaptadores são bem-vindas antes do código.

## O que o Wakilarium nunca fará

Copiar o conteúdo de um prompt ou de uma resposta; mostrar um detalhe privado em uma página pública; chamar um endereço privado a partir de um evento recebido; executar o que quer que seja. Ele guarda e mostra.

## Licença

Apache 2.0. Um projeto da [zelij.ai](https://zelij.ai/), nascido do aquário do [Zelij Core](https://github.com/zelij-ai/zelij-core).
