# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · **العربية** · [فارسی](README.fa.md) · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![مشهد Wakilarium: الإنسان بالذهبي، وكيل في كل مسار، زائر عند المدخل؛ بطاقة حوار ورابطها يسبحان بينهم](docs/img/wakilarium.gif)

*يوم محاكى، شخصيات خيالية: هذا نموذج `demo/index.html`، السمة الليلية. [صورة ثابتة بدقة عالية](docs/img/wakilarium-hero.png).*

**شاهد وكلاءك يعملون.** Wakilarium هو صيغة أحداث مفتوحة، *Wakil Event*، ومكوّن ويب بلا تبعيات يضع أي وكيل ذكاء اصطناعي على المسرح: مسارات حسب المهنة، حلقة لكل وكيل، الإنسان بالذهبي، الزوار بخط منقّط، التبادلات والقرارات تسبح أمام عينيك، مباشرةً وبإعادة تشغيل على مدى أربع وعشرين ساعة. صفحة علنية تعرض المشهد نفسه دون أي تفصيل داخلي.

«وكيل» (وكيل) هو المفوَّض، من يتصرف باسم غيره؛ و«-arium» هو المكان الذي نراقبه فيه.

> الحالة في 19/10/2026: **الدفعة 0**. الصيغة v0.1 ومخططها ونموذج تفاعلي منشورة هنا للمراجعة. المكوّن والمجمّع والمحوّلات تأتي مع الدفعة 1. لا شيء قابل للتثبيت بعد.

## مشاهدة النموذج

افتح `demo/index.html` في متصفح (أو قدّم مجلد `demo/` عبر خادم). يُعاد تشغيل يوم خيالي: ساعة، سرعة، خط زمني، تكلفة اليوم، قرارات معلقة، مفتاح «العرض العلني»، سمتا الليل والنهار، الفرنسية والإنجليزية. لا طلبات شبكة: كل شيء داخل الصفحة.

## الصيغة في سطر واحد

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

عشرة أنواع من الأحداث (`run.start`، `run.end`، `tool`، `message`، `decision.open`، `decision.made`، `visitor`، `launch`، `cost`، `note`)، فاعل مع مساره، وقاعدة واحدة: **ما هو خاص يبقى خاصًا**. لا تخرج `title` و`detail` و`attrs` و`cost` أبدًا في عرض علني؛ وحده `public_title` (أو تسمية عامة) يمكن أن يظهر. المواصفة الكاملة: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) (بالفرنسية) · المخطط: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## ما هو مخطط له

| الدفعة | المحتوى |
|---|---|
| 0 | الاسم، الصيغة v0.1، المخطط، النموذج (هذا المستودع اليوم) |
| 1 | المكوّن `<wakil-arium>` (Canvas 2D، ESM + IIFE، npm وCDN)، المجمّع `wakil-collect` (Python: `POST /events`، متابعة ملف، OTLP/HTTP، SQLite، `GET /state`، صفحة علنية برمز، `demo`)، محوّل خطافات Claude Code، عرض توضيحي مستضاف |
| 2 | محوّلات OpenTelemetry GenAI / OpenInference وAG-UI وموصلات وكلاء الشراء؛ تحويل حوضَي Zelij Core ومنصة الناشر إلى المكوّن دون تراجع |

جداول المطابقة (Claude Code، OpenTelemetry، AG-UI، Zelij Core…) موجودة في المواصفة بالفعل: المراجعات والمساهمات بالمحوّلات مرحّب بها قبل الكود.

## ما لن يفعله Wakilarium أبدًا

نسخ محتوى موجّه أو إجابة نموذج؛ عرض تفصيل خاص على صفحة علنية؛ نداء عنوان خاص انطلاقًا من حدث مستلم؛ تنفيذ أي شيء. هو يحفظ ويعرض.

## الرخصة

Apache 2.0. مشروع من [zelij.ai](https://zelij.ai/)، وُلد من حوض [Zelij Core](https://github.com/zelij-ai/zelij-core).
