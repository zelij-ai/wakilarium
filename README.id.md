# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · **Bahasa Indonesia** · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![Adegan Wakilarium: manusia berwarna emas, satu agen per jalur, seorang pengunjung di pintu masuk; sebuah kartu dialog dan tautannya berenang di antara mereka](docs/img/wakilarium.gif)

*Hari simulasi, tokoh fiktif: ini adalah mockup `demo/index.html`, tema malam. [Gambar diam resolusi tinggi](docs/img/wakilarium-hero.png).*

**Saksikan agen Anda bekerja.** Wakilarium adalah format peristiwa terbuka, *Wakil Event*, dan komponen web tanpa dependensi yang memanggungkan agen AI apa pun: jalur menurut pekerjaan, satu cincin per agen, manusia berwarna emas, pengunjung bergaris putus-putus, pertukaran dan keputusan yang berenang di depan mata Anda, langsung dan dalam putar ulang selama dua puluh empat jam. Halaman publik menampilkan adegan yang sama tanpa satu pun detail internal.

« Wakil » (وكيل) adalah kuasa, orang yang bertindak atas nama orang lain; « -arium » adalah tempat kita mengamatinya.

> Status per 19/10/2026: **lot 0**. Format v0.1, skemanya, dan sebuah mockup interaktif dipublikasikan di sini untuk ditinjau. Komponen, kolektor, dan adaptor hadir di lot 1. Belum ada yang bisa dipasang.

## Lihat mockup

Buka `demo/index.html` di peramban (atau sajikan folder `demo/`). Satu hari fiktif diputar ulang: jam, kecepatan, garis waktu, biaya hari ini, keputusan tertunda, sakelar « tampilan publik », tema malam dan siang, bahasa Prancis dan Inggris. Tanpa permintaan jaringan: semuanya ada di dalam halaman.

## Format dalam satu baris

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

Sepuluh jenis peristiwa (`run.start`, `run.end`, `tool`, `message`, `decision.open`, `decision.made`, `visitor`, `launch`, `cost`, `note`), seorang aktor dengan jalurnya, dan satu aturan: **yang privat tetap privat**. `title`, `detail`, `attrs`, dan `cost` tidak pernah muncul di tampilan publik; hanya `public_title` (atau label generik) yang boleh ditampilkan. Spesifikasi lengkap: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) (bahasa Prancis) · skema: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## Yang direncanakan

| Lot | Isi |
|---|---|
| 0 | nama, format v0.1, skema, mockup (repositori ini hari ini) |
| 1 | komponen `<wakil-arium>` (Canvas 2D, ESM + IIFE, npm dan CDN), kolektor `wakil-collect` (Python: `POST /events`, pemantauan berkas, OTLP/HTTP, SQLite, `GET /state`, halaman publik dengan token, `demo`), adaptor hook Claude Code, demo yang dihosting |
| 2 | adaptor OpenTelemetry GenAI / OpenInference, AG-UI, konektor agen belanja; peralihan akuarium Zelij Core dan platform penerbit ke komponen, tanpa regresi |

Tabel pemetaan (Claude Code, OpenTelemetry, AG-UI, Zelij Core…) sudah ada di spesifikasi: tinjauan dan kontribusi adaptor disambut sebelum kode.

## Yang tidak akan pernah dilakukan Wakilarium

Menyalin isi prompt atau jawaban model; menampilkan detail privat di halaman publik; memanggil alamat privat dari peristiwa yang diterima; menjalankan apa pun. Ia menyimpan dan ia menampilkan.

## Lisensi

Apache 2.0. Sebuah proyek [zelij.ai](https://zelij.ai/), lahir dari akuarium [Zelij Core](https://github.com/zelij-ai/zelij-core).
