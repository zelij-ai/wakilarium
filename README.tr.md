# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **Türkçe** · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![Wakilarium sahnesi: altın rengindeki insan, her kulvarda bir ajan, girişte bir ziyaretçi; bir diyalog kartı ve bağlantısı aralarında yüzüyor](docs/img/wakilarium.gif)

*Simüle edilmiş bir gün, kurgusal karakterler: bu, `demo/index.html` maketi, gece teması. [Yüksek çözünürlüklü sabit görsel](docs/img/wakilarium-hero.png).*

**Ajanlarınızın çalışmasını izleyin.** Wakilarium, açık bir olay biçimi olan *Wakil Event* ve herhangi bir yapay zekâ ajanını sahneye koyan bağımlılıksız bir web bileşenidir: mesleğe göre kulvarlar, ajan başına bir halka, altın rengindeki insan, kesikli çizgili ziyaretçiler, gözlerinizin önünde yüzen alışverişler ve kararlar; canlı ve yirmi dört saat boyunca yeniden oynatılabilir. Herkese açık bir sayfa aynı sahneyi hiçbir iç ayrıntı olmadan gösterir.

«Wakil» (وكيل) vekildir, bir başkası adına hareket eden kişi; «-arium» ise onu izlediğiniz yerdir.

> 19/10/2026 itibarıyla durum: **lot 0**. v0.1 biçimi, şeması ve etkileşimli bir maket inceleme için burada yayımlandı. Bileşen, toplayıcı ve adaptörler lot 1 ile geliyor. Henüz kurulabilir bir şey yok.

## Maketi görün

`demo/index.html` dosyasını bir tarayıcıda açın (ya da `demo/` klasörünü sunun). Kurgusal bir gün yeniden oynar: saat, hız, zaman çizgisi, günün maliyeti, bekleyen kararlar, «herkese açık görünüm» anahtarı, gece ve gündüz temaları, Fransızca ve İngilizce. Hiçbir ağ isteği yok: her şey sayfanın içinde.

## Biçim tek satırda

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

On olay türü (`run.start`, `run.end`, `tool`, `message`, `decision.open`, `decision.made`, `visitor`, `launch`, `cost`, `note`), kulvarıyla bir aktör ve tek bir kural: **özel olan özel kalır**. `title`, `detail`, `attrs` ve `cost` asla herkese açık bir görünüme çıkmaz; yalnızca `public_title` (ya da genel bir etiket) gösterilebilir. Tam belirtim: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) (Fransızca) · şema: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## Yol haritası

| Lot | İçerik |
|---|---|
| 0 | ad, v0.1 biçimi, şema, maket (bugün bu depo) |
| 1 | `<wakil-arium>` bileşeni (Canvas 2D, ESM + IIFE, npm ve CDN), `wakil-collect` toplayıcısı (Python: `POST /events`, dosya izleme, OTLP/HTTP, SQLite, `GET /state`, belirteçle herkese açık sayfa, `demo`), Claude Code kanca adaptörü, barındırılan demo |
| 2 | OpenTelemetry GenAI / OpenInference, AG-UI ve alışveriş ajanı adaptörleri; Zelij Core ve yayıncı platformunun akvaryumlarının gerilemesiz olarak bileşene geçişi |

Eşleme tabloları (Claude Code, OpenTelemetry, AG-UI, Zelij Core…) zaten belirtimde: koddan önce incelemeler ve adaptör katkıları memnuniyetle karşılanır.

## Wakilarium'un asla yapmayacağı şeyler

Bir istemin ya da model yanıtının içeriğini kopyalamak; herkese açık bir sayfada özel bir ayrıntı göstermek; alınan bir olaydan özel bir adresi çağırmak; herhangi bir şey çalıştırmak. O saklar ve gösterir.

## Lisans

Apache 2.0. [Zelij Core](https://github.com/zelij-ai/zelij-core) akvaryumundan doğan bir [zelij.ai](https://zelij.ai/) projesi.
