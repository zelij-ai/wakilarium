# Wakilarium

[English](README.en.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Türkçe](README.tr.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-BR.md) · [العربية](README.ar.md) · **فارسی** · [Bahasa Indonesia](README.id.md) · [Italiano](README.it.md) · [Ελληνικά](README.el.md) · [മലയാളം](README.ml.md) · [Roman Urdu](README.ur.md) · [Română](README.ro.md)

![صحنهٔ Wakilarium: انسان طلایی، یک عامل در هر مسیر، یک بازدیدکننده در ورودی؛ یک کارت گفت‌وگو و پیوندش میان آن‌ها شنا می‌کنند](docs/img/wakilarium.gif)

*روز شبیه‌سازی‌شده، شخصیت‌های خیالی: این ماکت `demo/index.html` است، پوستهٔ شب. [تصویر ثابت با وضوح بالا](docs/img/wakilarium-hero.png).*

**عامل‌های خود را در حال کار تماشا کنید.** Wakilarium یک قالب رویداد باز، *Wakil Event*، و یک مؤلفهٔ وب بدون وابستگی است که هر عامل هوش مصنوعی را روی صحنه می‌برد: مسیرها بر اساس شغل، یک حلقه برای هر عامل، انسان طلایی، بازدیدکنندگان نقطه‌چین، تبادل‌ها و تصمیم‌هایی که جلوی چشم شما شنا می‌کنند، زنده و با بازپخش بیست‌وچهار ساعته. یک صفحهٔ عمومی همان صحنه را بدون هیچ جزئیات داخلی نشان می‌دهد.

«وکیل» (وكيل) نماینده است، کسی که از جانب دیگری عمل می‌کند؛ «-arium» جایی است که او را تماشا می‌کنیم.

> وضعیت در ۱۹/۱۰/۲۰۲۶: **بستهٔ ۰**. قالب v0.1، طرحوارهٔ آن و یک ماکت تعاملی برای بازبینی اینجا منتشر شده‌اند. مؤلفه، گردآورنده و مبدل‌ها با بستهٔ ۱ می‌آیند. هنوز چیزی قابل نصب نیست.

## دیدن ماکت

`demo/index.html` را در مرورگر باز کنید (یا پوشهٔ `demo/` را سرو کنید). یک روز خیالی بازپخش می‌شود: ساعت، سرعت، خط زمان، هزینهٔ روز، تصمیم‌های در انتظار، کلید «نمای عمومی»، پوسته‌های شب و روز، فرانسوی و انگلیسی. هیچ درخواست شبکه‌ای وجود ندارد: همه‌چیز درون صفحه است.

## قالب در یک خط

```json
{"v":"0.1","ts":"2026-10-19T10:05:00+02:00","kind":"decision.open","actor":{"id":"chef","name":"Camille Aubert","role":"chef de cabinet","lane":"direction"},"target":{"id":"fondateur"},"title":"Publier la page d'offre ?","public_title":"propose une décision","status":"pending"}
```

ده نوع رویداد (`run.start`، `run.end`، `tool`، `message`، `decision.open`، `decision.made`، `visitor`، `launch`، `cost`، `note`)، یک کنشگر با مسیر خود، و یک قاعده: **آنچه خصوصی است خصوصی می‌ماند**. `title`، `detail`، `attrs` و `cost` هرگز در نمای عمومی ظاهر نمی‌شوند؛ تنها `public_title` (یا یک برچسب عمومی) می‌تواند نمایش داده شود. مشخصات کامل: [`docs/wakil-event-v0.1.md`](docs/wakil-event-v0.1.md) (به فرانسوی) · طرحواره: [`schema/wakil-event-0.1.schema.json`](schema/wakil-event-0.1.schema.json).

## آنچه برنامه‌ریزی شده

| بسته | محتوا |
|---|---|
| ۰ | نام، قالب v0.1، طرحواره، ماکت (همین مخزن، امروز) |
| ۱ | مؤلفهٔ `<wakil-arium>` (Canvas 2D، ESM + IIFE، npm و CDN)، گردآورندهٔ `wakil-collect` (Python: `POST /events`، دنبال‌کردن فایل، OTLP/HTTP، SQLite، `GET /state`، صفحهٔ عمومی با توکن، `demo`)، مبدل هوک‌های Claude Code، دموی میزبانی‌شده |
| ۲ | مبدل‌های OpenTelemetry GenAI / OpenInference، AG-UI و رابط‌های عامل‌های خرید؛ انتقال آکواریوم‌های Zelij Core و پلتفرم ناشر به این مؤلفه، بدون پسرفت |

جدول‌های تناظر (Claude Code، OpenTelemetry، AG-UI، Zelij Core…) از همین حالا در مشخصات هستند: بازبینی‌ها و مشارکت در مبدل‌ها پیش از کد خوش‌آمدند.

## کارهایی که Wakilarium هرگز نخواهد کرد

کپی‌کردن محتوای یک پرامپت یا پاسخ مدل؛ نمایش یک جزئیات خصوصی در صفحهٔ عمومی؛ فراخوانی یک نشانی خصوصی از روی رویداد دریافتی؛ اجرای هر چیزی. او نگه می‌دارد و نشان می‌دهد.

## مجوز

Apache 2.0. پروژه‌ای از [zelij.ai](https://zelij.ai/)، زاده از آکواریوم [Zelij Core](https://github.com/zelij-ai/zelij-core).
