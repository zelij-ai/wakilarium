# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · **ไทย** · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![ฉาก Wakilarium: มนุษย์สีทอง เอเจนต์หนึ่งตัวต่อหนึ่งเลน ผู้มาเยือนที่ทางเข้า การ์ดบทสนทนาและเส้นเชื่อมของมันว่ายอยู่ระหว่างพวกเขา](docs/img/wakilarium.gif)

*หนึ่งวันจำลอง ตัวละครสมมติ: นี่คือแบบจำลอง `demo/index.html` ธีมกลางคืน [ภาพนิ่งความละเอียดสูง](docs/img/wakilarium-hero.png)*

**ดูเอเจนต์ของคุณทำงาน** Wakilarium คือรูปแบบเหตุการณ์แบบเปิด *Wakil Event* และเว็บคอมโพเนนต์ที่ไม่มี dependency ซึ่งนำเอเจนต์ AI ใดก็ได้ขึ้นเวที: เลนตามสายงาน วงแหวนหนึ่งวงต่อเอเจนต์หนึ่งตัว มนุษย์สีทอง ผู้มาเยือนเป็นเส้นประ การสนทนาและการตัดสินใจว่ายอยู่ตรงหน้าคุณ ทั้งแบบสดและเล่นซ้ำย้อนหลังยี่สิบสี่ชั่วโมง หน้าสาธารณะแสดงฉากเดียวกันโดยไม่มีรายละเอียดภายในใด ๆ

« Wakil » (وكيل) คือผู้รับมอบอำนาจ ผู้ที่กระทำการแทนผู้อื่น ส่วน « -arium » คือสถานที่ที่เราเฝ้าดูมัน

> สถานะ ณ 19/10/2026: **ล็อต 0** รูปแบบ v0.1 สคีมา และแบบจำลองแบบโต้ตอบเผยแพร่ที่นี่เพื่อรับการตรวจทาน คอมโพเนนต์ ตัวรวบรวม และอะแดปเตอร์จะมาในล็อต 1 ยังไม่มีอะไรติดตั้งได้

## ดูแบบจำลอง

เปิด `demo/index.html` ในเบราว์เซอร์ (หรือเสิร์ฟโฟลเดอร์ `demo/`) หนึ่งวันสมมติจะเล่นซ้ำ: นาฬิกา ความเร็ว ไทม์ไลน์ ต้นทุนของวัน การตัดสินใจที่รออยู่ สวิตช์ « มุมมองสาธารณะ » ธีมกลางคืนและกลางวัน ภาษาฝรั่งเศสและอังกฤษ ไม่มีคำขอเครือข่ายใด ๆ: ทุกอย่างอยู่ในหน้าเว็บ

## รูปแบบในหนึ่งบรรทัด

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

เหตุการณ์สิบชนิด (`run.start`, `run.end`, `tool`, `message`, `decision.open`, `decision.made`, `visitor`, `launch`, `cost`, `note`) ผู้กระทำพร้อมเลนของตน และกฎหนึ่งข้อ: **สิ่งที่เป็นส่วนตัวย่อมเป็นส่วนตัวต่อไป** `title`, `detail`, `attrs` และ `cost` ไม่มีวันปรากฏบนมุมมองสาธารณะ มีเพียง `public_title` (หรือป้ายกำกับทั่วไป) เท่านั้นที่แสดงได้ ข้อกำหนดฉบับเต็ม: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) (ภาษาฝรั่งเศส) · สคีมา: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json)

## แผนงาน

| ล็อต | เนื้อหา |
|---|---|
| 0 | ชื่อ รูปแบบ v0.1 สคีมา แบบจำลอง (ที่เก็บนี้ในวันนี้) |
| 1 | คอมโพเนนต์ `<wakil-arium>` (Canvas 2D, ESM + IIFE, npm และ CDN), ตัวรวบรวม `wakil-collect` (Python: `POST /events`, ติดตามไฟล์, OTLP/HTTP, SQLite, `GET /state`, หน้าสาธารณะด้วยโทเค็น, `demo`), อะแดปเตอร์ hook ของ Claude Code, เดโมที่โฮสต์ไว้ |
| 2 | อะแดปเตอร์ OpenTelemetry GenAI / OpenInference, AG-UI และตัวเชื่อมต่อเอเจนต์ช้อปปิ้ง; เปลี่ยนอควาเรียมของ Zelij Core และของแพลตฟอร์มผู้เผยแพร่มาใช้คอมโพเนนต์โดยไม่ถดถอย |

ตารางการจับคู่ (Claude Code, OpenTelemetry, AG-UI, Zelij Core…) อยู่ในข้อกำหนดแล้ว: ยินดีรับการตรวจทานและการมีส่วนร่วมด้านอะแดปเตอร์ก่อนเขียนโค้ด

## สิ่งที่ Wakilarium จะไม่มีวันทำ

คัดลอกเนื้อหาของพรอมต์หรือคำตอบของโมเดล; แสดงรายละเอียดส่วนตัวบนหน้าสาธารณะ; เรียกที่อยู่ส่วนตัวจากเหตุการณ์ที่ได้รับ; รันสิ่งใดก็ตาม มันเก็บและมันแสดง เท่านั้น

## สัญญาอนุญาต

Apache 2.0 โครงการของ [zelij.ai](https://zelij.ai/) ที่ถือกำเนิดจากอควาเรียมของ [Zelij Core](https://github.com/zelij-ai/zelij-core)
