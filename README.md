# فال حافظ · Faal-e Hafez

وب‌اپ فال حافظ: نیت کنید، غزلی از دیوان حافظ باز می‌شود و تعبیرش را می‌خوانید.
یک PWA رسپانسیو برای موبایل، تبلت و دسکتاپ که نصب می‌شود و **بدون اینترنت** هم کار می‌کند.

A responsive, installable, offline-first Progressive Web App for Hafez divination (Faal-e Hafez), in Persian (RTL).

> Designed & Developed by Hadi Rasouli

## امکانات

- فال تصادفی با انیمیشن نیت و باز شدن غزل، و **فال امروز** (برای همه در یک روز یکسان)
- ۴۹۵ غزل با دو متن: **تعبیر سنتی** و **تفسیر کوتاه**، کاملاً آفلاین (شمارهٔ غزل‌ها طبق دیوان قزوینی-غنی)
- دیوان با جست‌وجوی فارسی (نادیده گرفتن اعراب، ی/ي، ک/ك، نیم‌فاصله) و جست‌وجو با شمارهٔ غزل
- نشان‌شده‌ها و تاریخچهٔ فال‌ها
- کپی، ارسال متن، و ساخت **تصویر** غزل برای اشتراک‌گذاری
- **یادآور روزانه** (اعلان + زنگ) و فایل **تقویم (.ics)** برای هشدار قطعی
- **نصب اپ** (Android/Desktop با دکمهٔ نصب، iOS با راهنمای مرحله‌به‌مرحله)
- **آموزش آغازین** (۴ صفحه) که از تنظیمات دوباره باز می‌شود
- پوستهٔ روشن/تیره/خودکار و سه اندازهٔ متن شعر
- فونت‌ها از CDN (Vazirmatn، Aref Ruqaa، Noto Naskh Arabic)

## اجرا

هیچ مرحلهٔ build یا وابستگی npm ندارد. فقط فایل‌ها را روی یک سرور استاتیک (یا `localhost`) سرو کنید؛ Service Worker و نصب اپ روی `file://` کار نمی‌کنند.

```bash
python3 -m http.server 8080
# سپس http://localhost:8080 را باز کنید
```

## انتشار روی GitHub Pages

۱. مخزن را روی GitHub بسازید و شاخهٔ `main` را push کنید.
۲. در **Settings → Pages → Source** گزینهٔ **GitHub Actions** را انتخاب کنید.
۳. workflow داخل `.github/workflows/pages.yml` خودکار منتشر می‌کند.

همهٔ مسیرها نسبی‌اند، پس هم روی `username.github.io/repo/` و هم روی دامنهٔ اختصاصی کار می‌کند.

## ساختار پروژه

```
index.html              صفحهٔ اصلی و CDN فونت‌ها
manifest.webmanifest    تنظیمات نصب PWA
sw.js                   کش آفلاین + یادآور پس‌زمینه
css/style.css           طراحی (متغیرهای رنگ، حالت تیره، رسپانسیو)
js/app.js               مسیریابی (hash) و صفحه‌ها
js/store.js             ذخیرهٔ تنظیمات، نشان‌ها، تاریخچه (localStorage)
js/notify.js            یادآور، زنگ، فایل تقویم
js/share.js             اشتراک متن و ساخت تصویر
js/shared.js            کد مشترک صفحه و Service Worker (فال امروز، IndexedDB)
js/ornament.js          نقش ستارهٔ کاشی
data/faals.json         ۴۹۵ غزل با تعبیر
scripts/build-data.py   ساخت faals.json از دیتابیس اصلی
icons/                  آیکن‌های PWA
```

## دربارهٔ یادآور و زنگ

اپ‌های وب وقتی بسته‌اند محدودیت دارند. برای همین سه لایه کنار هم کار می‌کنند:

1. **اپ باز است:** تایمر داخلی در ساعت تعیین‌شده اعلان می‌فرستد و زنگ می‌زند.
2. **اپ نصب‌شده، مرورگرهای پشتیبان (Chrome/Edge):** Periodic Background Sync سرویس‌ورکر را بیدار می‌کند. زمان‌بندی دست مرورگر است و دقیق نیست.
3. **فایل تقویم:** دکمهٔ «افزودن به تقویم» یک رویداد روزانه با هشدار می‌سازد. این تنها روش کاملاً مطمئن روی همهٔ دستگاه‌هاست.

اعلان واقعاً دقیق وقتی اپ بسته است نیاز به **Web Push** و یک سرور دارد که عمداً در این پروژهٔ استاتیک نیست. روی iOS اعلان‌ها فقط بعد از افزودن اپ به صفحهٔ اصلی و از نسخهٔ ۱۶٫۴ کار می‌کنند.

## داده و مجوز

متن غزل‌ها از دیوان حافظ است (قرن هشتم هجری). مجموعهٔ غزل‌ها و تعبیرها از
[HafezFaalDatabase](https://github.com/mahmoud-eskandari/HafezFaalDatabase)
(GPL-3.0) گرفته شده، بنابراین این پروژه هم تحت **GPL-3.0** منتشر می‌شود. جزئیات در [NOTICE.md](NOTICE.md).

منبع تفسیر کوتاه [hafez-ghazals-json](https://github.com/parsasandoughi/hafez-ghazals-json) فایل مجوز ندارد؛ پیش از انتشار عمومی [NOTICE.md](NOTICE.md) را بخوانید.

برای به‌روزرسانی داده: `python3 scripts/build-data.py Faals.json --extra hafez_ghazals.json -o data/faals.json` (بدون `--extra` فقط تعبیر سنتی ساخته می‌شود) و سپس عدد `VERSION` در `sw.js` را بالا ببرید تا کش کاربران نو شود.

## English

Static site, no build step. Serve the folder over HTTP(S) and open it. Hash router, vanilla ES modules, service worker with precache, `data/faals.json` bundled (495 ghazals + interpretations, GPL-3.0). Daily reminder uses an in-page timer, Periodic Background Sync where supported, and an `.ics` calendar alarm as the reliable fallback; true background push needs a server and is out of scope.
