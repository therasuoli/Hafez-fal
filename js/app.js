import { store } from './store.js';
import { medallion, lozengeRule } from './ornament.js';
import * as notify from './notify.js';
import { sharePoem, copyPoem, shareCard } from './share.js';

const S = window.HafezShared;
const $ = (sel, root = document) => root.querySelector(sel);
const main = $('#main');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fa = (n) => Number(n).toLocaleString('fa-IR', { useGrouping: false });
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- icons ---------- */
const ICONS = {
  home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  refresh: '<path d="M23 4v6h-6"/><path d="M20.5 15a9 9 0 1 1-2.1-9.4L23 10"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
  install: '<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M12 7v7M9 11l3 3 3-3"/>',
  book2: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5A2.5 2.5 0 0 0 6.5 24H20"/>'
};
const ic = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;

/* ---------- data ---------- */
let poems = [];
const norm = (s) => String(s)
  .replace(/[ً-ٰٟـ]/g, '')
  .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[ةۀ]/g, 'ه')
  .replace(/‌/g, ' ')
  .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 1632)
  .replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 1776)
  .replace(/\s+/g, ' ').trim();

let dataPromise;
function loadData() {
  if (!dataPromise) {
    dataPromise = fetch('data/faals.json')
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((list) => {
        list.forEach((p) => {
          p.n = p.v.map(norm);
          p.b = [];
          for (let i = 0; i < p.n.length; i += 2) p.b.push(p.n[i] + ' ' + (p.n[i + 1] || ''));
        });
        poems = list;
        notify.schedule(poems);
        return list;
      })
      .catch((e) => { dataPromise = null; throw e; });
  }
  return dataPromise;
}

/* ---------- small UI helpers ---------- */
let toastTimer = 0;
function toast(message, link) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(message)}</span>${link ? `<a href="${link.href}">${esc(link.label)}</a>` : ''}`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), link ? 7000 : 3200);
}

const dlg = $('#dlg');
function openDialog(title, html) {
  $('#dlg-body').innerHTML = `<h2 id="dlg-title">${esc(title)}</h2>${html}`;
  if (!dlg.open) dlg.showModal();
}
dlg.addEventListener('click', (e) => {
  if (e.target === dlg || e.target.closest('[data-act="close-dialog"]')) dlg.close();
});

const dateFmt = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' });

/* ---------- theme / size ---------- */
function applyPrefs() {
  const root = document.documentElement;
  const theme = store.get('theme');
  if (theme === 'auto') root.removeAttribute('data-theme'); else root.dataset.theme = theme;
  root.dataset.size = String(store.get('size'));
  requestAnimationFrame(() => {
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    $('#meta-theme').setAttribute('content', bg || '#0c1730');
    updateThemeButton();
  });
}
function resolvedTheme() {
  const t = store.get('theme');
  return t === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t;
}
function updateThemeButton() {
  const btn = $('#theme-btn');
  if (!btn) return;
  const dark = resolvedTheme() === 'dark';
  btn.innerHTML = ic(dark ? 'sun' : 'moon');
  btn.setAttribute('aria-label', dark ? 'حالت روشن' : 'حالت تیره');
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyPrefs);

/* ---------- install ---------- */
let deferredInstall = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });
window.addEventListener('appinstalled', () => {
  deferredInstall = null;
  toast('اپ نصب شد. حالا از صفحهٔ اصلی گوشی یا رایانه باز می‌شود.');
  updateInstallButton();
});

function updateInstallButton() {
  $('#install-btn').hidden = isStandalone();
}

async function installApp() {
  if (deferredInstall) {
    deferredInstall.prompt();
    await deferredInstall.userChoice.catch(() => {});
    deferredInstall = null;
    return;
  }
  if (isIOS()) {
    openDialog('نصب روی آیفون و آیپد', `
      <ol class="steps">
        <li>در Safari دکمهٔ اشتراک‌گذاری (مربع با فلش رو به بالا) را بزنید.</li>
        <li>گزینهٔ «Add to Home Screen» یعنی «افزودن به صفحهٔ اصلی» را انتخاب کنید.</li>
        <li>روی «Add» بزنید. اپ روی صفحهٔ اصلی ظاهر می‌شود.</li>
      </ol>
      <p class="note">اعلان‌ها در iOS فقط بعد از نصب اپ و از نسخهٔ ۱۶٫۴ به بعد کار می‌کنند.</p>
      <button class="btn btn-primary" data-act="close-dialog">متوجه شدم</button>`);
  } else {
    openDialog('نصب اپ', `
      <p>مرورگر شما نصب خودکار را پیشنهاد نکرد. از منوی مرورگر (سه‌نقطه) گزینهٔ «Install app» یا «Add to Home screen» را بزنید.</p>
      <button class="btn btn-primary" data-act="close-dialog">متوجه شدم</button>`);
  }
}

/* ---------- reminder control ---------- */
async function enableReminder() {
  if (!notify.notificationsSupported()) {
    toast('این مرورگر اعلان را پشتیبانی نمی‌کند. از «افزودن به تقویم» استفاده کنید.');
    return false;
  }
  let p = notify.permission();
  if (p === 'default') p = await notify.requestPermission();
  if (p !== 'granted') {
    toast('اجازهٔ اعلان داده نشد. آن را از تنظیمات سایت در مرورگر فعال کنید.');
    return false;
  }
  store.patchReminder({ on: true });
  notify.schedule(poems);
  notify.syncWorker();
  return true;
}
function disableReminder() {
  store.patchReminder({ on: false });
  notify.schedule(poems);
  notify.syncWorker();
}

/* ---------- drawing a fal ---------- */
const randomInt = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
function pickId() {
  const recent = new Set(store.get('history').slice(0, 5).map((h) => h.id));
  let id;
  do { id = randomInt(poems.length) + 1; } while (recent.has(id) && poems.length > 10);
  return id;
}
function goToFal(animate) {
  const id = pickId();
  store.addHistory(id, 'fal');
  location.hash = `#/ghazal/${id}?src=fal${animate ? '&reveal=1' : ''}`;
}

/* ---------- row component ---------- */
const row = (p, sub, extra = '') => `
  <li class="row-item">
    <a class="row" href="#/ghazal/${p.id}">
      <span class="num">${fa(p.id)}</span>
      <span class="txt"><span class="l1">${esc(p.v[0])}</span><span class="l2">${esc(sub ?? p.v[1] ?? '')}</span></span>
    </a>${extra}
  </li>`;

/* ---------- views ---------- */
function homeView() {
  const dp = poems[S.dailyIndex(S.dayKey(), poems.length)];
  const last = store.get('history')[0];
  const lp = last && poems[last.id - 1];
  const remOn = store.get('reminder').on;
  return {
    title: 'فال حافظ',
    html: `
    <section class="home">
      <div class="home-hero">
        <h1 class="display">نیت کن، فال بگیر</h1>
        <p class="lede">آرام نیت کنید و روی ستاره بزنید. غزلی از دیوان حافظ برایتان باز می‌شود.</p>
        <button class="medal-btn" data-act="draw" aria-label="فال بگیر">
          ${medallion()}<span class="medal-label">فال بگیر</span>
        </button>
      </div>
      <div class="home-side">
        <a class="daily" href="#/daily">
          <span class="daily-head">فال امروز</span>
          <span class="daily-verse">${esc(dp.v[0])}</span>
          <span class="daily-verse">${esc(dp.v[1] || '')}</span>
          <span class="daily-more">خواندن غزل ${fa(dp.id)} ${ic('left')}</span>
        </a>
        ${lp ? `<a class="quiet-row" href="#/ghazal/${lp.id}?src=fal"><span>آخرین فال شما، غزل ${fa(lp.id)}</span><span class="muted">${esc(lp.v[0])}</span></a>` : ''}
        ${remOn ? '' : `<a class="quiet-row" href="#/settings">${ic('bell')}<span>هر روز صبح فال امروز را یادآوری کنید</span></a>`}
      </div>
    </section>`
  };
}

const tabirMode = (p) => (p.t2 && store.get('tabir') === 1 ? 1 : 0);
const tabirBody = (p) => (tabirMode(p) ? p.t2 : [p.t]).map((t) => `<p>${esc(t)}</p>`).join('');
const tabirPlain = (p) => (tabirMode(p) ? p.t2.join('\n') : p.t);

function ghazalView(id, q, src) {
  const p = poems[id - 1];
  if (!p) return notFoundView();
  const beyts = [];
  for (let i = 0; i < p.v.length; i += 2) beyts.push([p.v[i], p.v[i + 1]]);
  const fav = store.isFav(id);
  const tag = src === 'daily' ? 'فال امروز' : src === 'fal' ? 'فال شما' : 'دیوان حافظ';
  const backHref = src ? '#/' : '#/diwan';
  const fromFal = src === 'fal' || src === 'daily';
  return {
    title: `غزل ${fa(id)}`,
    html: `
    <article class="ghazal${q.get('reveal') ? ' reveal' : ''}">
      <div class="g-head">
        <a class="back" href="${backHref}">${ic('right')}<span>${src ? 'خانه' : 'دیوان'}</span></a>
        <span class="cartouche">${tag}</span>
      </div>
      <h1 class="g-title">غزل ${fa(id)}</h1>
      <div class="jadval" lang="fa">
        ${beyts.map((b, i) => `<p class="beyt" style="--i:${i}"><span class="m">${esc(b[0])}</span>${b[1] ? `<span class="m">${esc(b[1])}</span>` : ''}</p>`).join('')}
      </div>
      <section class="tabir" data-id="${id}" aria-labelledby="tabir-h">
        <div class="tabir-head">
          <h2 id="tabir-h">تعبیر</h2>
          ${p.t2 ? seg('tabir', [[0, 'تعبیر سنتی'], [1, 'تفسیر کوتاه']], tabirMode(p)) : ''}
        </div>
        <div id="tabir-body" aria-live="polite">${tabirBody(p)}</div>
        <p class="note">تعبیرها برای سرگرمی و آشنایی با دیوان آمده‌اند.</p>
      </section>
      <div class="actions">
        <button class="btn" data-act="fav" data-id="${id}" aria-pressed="${fav}">${ic('bookmark', fav ? 'filled' : '')}<span>${fav ? 'نشان شد' : 'نشان کردن'}</span></button>
        <button class="btn" data-act="copy" data-id="${id}">${ic('copy')}<span>کپی</span></button>
        <button class="btn" data-act="share" data-id="${id}">${ic('share')}<span>ارسال</span></button>
        <button class="btn" data-act="card" data-id="${id}">${ic('image')}<span>تصویر</span></button>
      </div>
      ${fromFal
        ? `<div class="after"><button class="btn btn-primary" data-act="redraw">${ic('refresh')}<span>فال دوباره</span></button><a class="btn btn-quiet" href="#/diwan">دیوان حافظ</a></div>`
        : `<nav class="pager" aria-label="غزل‌های دیگر">
            ${id > 1 ? `<a class="btn btn-quiet" href="#/ghazal/${id - 1}">${ic('right')}<span>غزل ${fa(id - 1)}</span></a>` : '<span></span>'}
            ${id < poems.length ? `<a class="btn btn-quiet" href="#/ghazal/${id + 1}"><span>غزل ${fa(id + 1)}</span>${ic('left')}</a>` : '<span></span>'}
          </nav>`}
    </article>`,
    mount() {
      if (q.get('reveal')) history.replaceState(null, '', `#/ghazal/${id}?src=${src || 'fal'}`);
    }
  };
}

function dailyView() {
  const id = S.dailyIndex(S.dayKey(), poems.length) + 1;
  const today = S.dayKey();
  const seen = store.get('history').some((h) => h.src === 'daily' && h.id === id && S.dayKey(new Date(h.ts)) === today);
  if (!seen) store.addHistory(id, 'daily');
  return ghazalView(id, new URLSearchParams(), 'daily');
}

const diwanState = { q: '', limit: 80 };
function searchPoems(raw) {
  const q = norm(raw);
  if (!q) return poems.map((p) => ({ p, line: null }));
  if (/^\d+$/.test(q)) return poems[+q - 1] ? [{ p: poems[+q - 1], line: null }] : [];
  const out = [];
  for (const p of poems) {
    const i = p.n.findIndex((l) => l.includes(q));
    if (i >= 0) { out.push({ p, line: p.v[i] }); continue; }
    const k = p.b.findIndex((b) => b.includes(q));
    if (k >= 0) out.push({ p, line: p.v[k * 2] });
  }
  return out;
}

function diwanView() {
  return {
    title: 'دیوان حافظ',
    html: `
    <section class="page">
      <h1 class="page-title">دیوان حافظ</h1>
      <p class="page-sub">${fa(poems.length)} غزل. با کلمه یا شمارهٔ غزل جست‌وجو کنید.</p>
      <label class="search">
        ${ic('search')}
        <span class="sr">جست‌وجو در غزل‌ها</span>
        <input id="q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="مثلاً: ساقی، شیراز، ۱۱۰" value="${esc(diwanState.q)}">
      </label>
      <p class="count" id="count" aria-live="polite"></p>
      <ul class="rows" id="results"></ul>
      <div class="more-wrap"><button class="btn btn-quiet" id="more" data-act="more" hidden>نمایش بیشتر</button></div>
    </section>`,
    mount() {
      const input = $('#q');
      const render = () => {
        const hits = searchPoems(diwanState.q);
        const shown = hits.slice(0, diwanState.limit);
        $('#results').innerHTML = shown.map(({ p, line }) => row(p, line)).join('')
          || `<li class="empty">غزلی با این عبارت پیدا نشد. املای دیگری را امتحان کنید یا شمارهٔ غزل را بنویسید.</li>`;
        $('#count').textContent = diwanState.q ? `${fa(hits.length)} غزل پیدا شد` : '';
        $('#more').hidden = hits.length <= shown.length;
      };
      let t = 0;
      input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => { diwanState.q = input.value; diwanState.limit = 80; render(); }, 120);
      });
      render();
      this.rerender = render;
    }
  };
}

function favoritesView() {
  const ids = store.get('favorites').filter((id) => poems[id - 1]);
  return {
    title: 'نشان‌شده‌ها',
    html: `
    <section class="page">
      <h1 class="page-title">نشان‌شده‌ها</h1>
      ${ids.length
        ? `<ul class="rows">${ids.map((id) => row(poems[id - 1], null, `<button class="icon-btn" data-act="unfav" data-id="${id}" aria-label="برداشتن نشان غزل ${fa(id)}">${ic('x')}</button>`)).join('')}</ul>`
        : `<div class="empty-state"><p>هنوز غزلی را نشان نکرده‌اید. در صفحهٔ هر غزل «نشان کردن» را بزنید تا اینجا جمع شود.</p><a class="btn btn-primary" href="#/">فال بگیر</a></div>`}
    </section>`
  };
}

function historyView() {
  const items = store.get('history').filter((h) => poems[h.id - 1]);
  const label = { fal: 'فال', daily: 'فال امروز' };
  return {
    title: 'تاریخچه',
    html: `
    <section class="page">
      <h1 class="page-title">تاریخچهٔ فال‌ها</h1>
      ${items.length
        ? `<ul class="rows">${items.map((h) => row(poems[h.id - 1], `${label[h.src] || 'فال'}، ${dateFmt.format(h.ts)}`)).join('')}</ul>
           <div class="more-wrap"><button class="btn btn-quiet" data-act="clear-history">${ic('trash')}<span>پاک کردن تاریخچه</span></button></div>`
        : `<div class="empty-state"><p>تاریخچه خالی است. هر فالی که بگیرید اینجا ثبت می‌شود.</p><a class="btn btn-primary" href="#/">فال بگیر</a></div>`}
    </section>`
  };
}

function permissionText() {
  switch (notify.permission()) {
    case 'granted': return 'اعلان‌ها در این مرورگر مجاز است.';
    case 'denied': return 'اعلان‌ها در مرورگر مسدود است. از تنظیمات سایت آن را مجاز کنید.';
    case 'unsupported': return 'این مرورگر اعلان را پشتیبانی نمی‌کند. از تقویم استفاده کنید.';
    default: return 'با روشن کردن یادآور، مرورگر اجازهٔ اعلان را می‌پرسد.';
  }
}

function seg(name, options, current) {
  return `<div class="seg" role="radiogroup">${options.map(([v, label]) => `
    <label><input type="radio" name="${name}" value="${v}" data-set="${name}" ${String(current) === String(v) ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div>`;
}

function settingsView() {
  const r = store.get('reminder');
  return {
    title: 'تنظیمات',
    html: `
    <section class="page settings">
      <h1 class="page-title">تنظیمات</h1>

      <div class="group">
        <h2>ظاهر</h2>
        <div class="field"><span class="flabel">پوسته</span>${seg('theme', [['auto', 'خودکار'], ['light', 'روشن'], ['dark', 'تیره']], store.get('theme'))}</div>
        <div class="field"><span class="flabel">اندازهٔ شعر</span>${seg('size', [[0, 'کوچک'], [1, 'متوسط'], [2, 'بزرگ']], store.get('size'))}</div>
      </div>

      <div class="group">
        <h2>یادآور روزانه</h2>
        <label class="field switch-field">
          <span class="flabel">اعلان فال امروز</span>
          <input class="switch" type="checkbox" role="switch" id="rem-on" data-set="rem-on" ${r.on ? 'checked' : ''}>
        </label>
        <label class="field">
          <span class="flabel">ساعت یادآور</span>
          <input class="time" type="time" id="rem-time" data-set="rem-time" value="${esc(r.time)}">
        </label>
        <label class="field switch-field">
          <span class="flabel">صدای زنگ وقتی اپ باز است</span>
          <input class="switch" type="checkbox" role="switch" data-set="sound" ${store.get('sound') ? 'checked' : ''}>
        </label>
        <p class="note" id="perm-note">${permissionText()}</p>
        <div class="btn-row">
          <button class="btn" data-act="test-notify">${ic('bell')}<span>اعلان آزمایشی</span></button>
          <button class="btn" data-act="ics">${ic('calendar')}<span>افزودن به تقویم</span></button>
        </div>
        <p class="note">اپ‌های وب وقتی بسته‌اند همیشه نمی‌توانند زنگ بزنند. اعلان پس‌زمینه فقط روی اپ نصب‌شده و در بعضی مرورگرها کار می‌کند. «افزودن به تقویم» یک هشدار روزانهٔ مطمئن در تقویم گوشی می‌سازد.</p>
      </div>

      <div class="group">
        <h2>نصب اپ</h2>
        <p class="note">${isStandalone() ? 'اپ نصب است و از صفحهٔ اصلی اجرا می‌شود.' : 'با نصب، اپ بدون نوار مرورگر و بدون اینترنت هم باز می‌شود.'}</p>
        ${isStandalone() ? '' : `<div class="btn-row"><button class="btn" data-act="install">${ic('install')}<span>نصب اپ</span></button></div>`}
      </div>

      <div class="group">
        <h2>راهنما و دربارهٔ اپ</h2>
        <div class="btn-row"><button class="btn" data-act="replay">${ic('book2')}<span>نمایش دوبارهٔ آموزش</span></button></div>
        <p class="note">متن غزل‌ها و تعبیر سنتی از پایگاه داده‌ی متن‌باز
          <a href="https://github.com/mahmoud-eskandari/HafezFaalDatabase" target="_blank" rel="noopener">HafezFaalDatabase</a>
          با مجوز GPL-3.0 است و تفسیر کوتاه از مجموعهٔ
          <a href="https://github.com/parsasandoughi/hafez-ghazals-json" target="_blank" rel="noopener">hafez-ghazals-json</a>
          گرفته شده. شمارهٔ غزل‌ها طبق دیوان قزوینی-غنی است.</p>
      </div>
    </section>`
  };
}

function notFoundView() {
  return { title: 'پیدا نشد', html: `<section class="page"><div class="empty-state"><h1 class="page-title">این صفحه پیدا نشد</h1><p>آدرس را بررسی کنید یا به خانه برگردید.</p><a class="btn btn-primary" href="#/">خانه</a></div></section>` };
}

/* ----- onboarding ----- */
const SLIDES = [
  { glyph: 'حافظ', title: 'به فال حافظ خوش آمدید', text: 'فال حافظ یک سنت ایرانی است: نیت می‌کنید، دیوان را باز می‌کنید و غزلی که پیش رو می‌آید پاسخ شما می‌شود. این اپ همان سنت را با ۴۹۵ غزل و تعبیر برایتان آورده است.' },
  { glyph: 'نیت', title: 'اول نیت کنید', text: 'چند نفس آرام بکشید و آنچه در دل دارید را فقط برای خودتان بگویید. بعد روی ستاره بزنید تا غزل باز شود.' },
  { icon: 'book', title: 'غزل، تعبیر، دیوان', text: 'غزل را بخوانید و تعبیرش را ببینید. غزل‌های دلخواه را نشان کنید، آن‌ها را با تصویر بفرستید یا در کل دیوان جست‌وجو کنید.' },
  { icon: 'bell', title: 'هر روز یک فال', text: 'یک ساعت برای فال امروز انتخاب کنید و اپ را نصب کنید تا بدون اینترنت هم کار کند. هر دو را هر وقت خواستید از تنظیمات عوض می‌کنید.', actions: true }
];
let slideIndex = 0;

function welcomeView() {
  const last = slideIndex === SLIDES.length - 1;
  const s = SLIDES[slideIndex];
  return {
    title: 'آموزش',
    html: `
    <section class="welcome" aria-roledescription="carousel" aria-label="آموزش">
      <div class="welcome-top">
        ${last ? '<span></span>' : '<button class="btn btn-quiet" data-act="onb-finish">رد کردن</button>'}
      </div>
      <div class="slide" role="group" aria-label="${fa(slideIndex + 1)} از ${fa(SLIDES.length)}">
        <div class="art">
          ${medallion()}
          <span class="art-glyph">${s.glyph ? esc(s.glyph) : ic(s.icon)}</span>
        </div>
        <h1 class="slide-title">${esc(s.title)}</h1>
        <p class="slide-text">${esc(s.text)}</p>
        ${s.actions ? `<div class="btn-row center">
          <button class="btn" data-act="onb-reminder">${ic('bell')}<span>${store.get('reminder').on ? 'یادآور روشن است' : 'روشن کردن یادآور ۸ صبح'}</span></button>
          ${isStandalone() ? '' : `<button class="btn" data-act="install">${ic('install')}<span>نصب اپ</span></button>`}
        </div>` : ''}
      </div>
      <div class="welcome-bottom">
        <div class="dots" aria-hidden="true">${SLIDES.map((_, i) => `<i class="${i === slideIndex ? 'on' : ''}"></i>`).join('')}</div>
        <div class="btn-row center">
          ${slideIndex > 0 ? '<button class="btn btn-quiet" data-act="onb-prev">قبلی</button>' : ''}
          ${last ? '<button class="btn btn-primary" data-act="onb-finish">شروع کنیم</button>' : '<button class="btn btn-primary" data-act="onb-next">بعدی</button>'}
        </div>
      </div>
    </section>`,
    mount() {
      let x0 = null;
      const el = $('.welcome');
      el.addEventListener('touchstart', (e) => { x0 = e.changedTouches[0].clientX; }, { passive: true });
      el.addEventListener('touchend', (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        x0 = null;
        if (Math.abs(dx) < 60) return;
        moveSlide(dx < 0 ? 1 : -1);   // RTL: swiping left goes forward
      }, { passive: true });
    }
  };
}
function moveSlide(step) {
  const next = Math.min(SLIDES.length - 1, Math.max(0, slideIndex + step));
  if (next !== slideIndex) { slideIndex = next; render(true); }
}
function finishOnboarding() {
  store.set('onboarded', true);
  slideIndex = 0;
  location.hash = '#/';
}

/* ---------- router ---------- */
const NAV = [
  ['#/', 'خانه', 'home'],
  ['#/diwan', 'دیوان', 'book'],
  ['#/favorites', 'نشان‌ها', 'bookmark'],
  ['#/history', 'تاریخچه', 'clock'],
  ['#/settings', 'تنظیمات', 'sliders']
];

function parseHash() {
  const raw = location.hash.slice(1) || '/';
  const [path, qs] = raw.split('?');
  return { path, q: new URLSearchParams(qs || '') };
}

let current = null;
async function render(keepScroll) {
  const { path, q } = parseHash();
  let route = path;

  if (!store.get('onboarded') && route !== '/welcome') {
    location.replace('#/welcome');
    return;
  }

  try { await loadData(); } catch {
    main.innerHTML = `<section class="page"><div class="empty-state"><h1 class="page-title">دیوان بارگذاری نشد</h1><p>اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.</p><button class="btn btn-primary" data-act="retry">تلاش دوباره</button></div></section>`;
    return;
  }

  let view;
  let m;
  if (route === '/') view = homeView();
  else if (route === '/diwan') view = diwanView();
  else if (route === '/favorites') view = favoritesView();
  else if (route === '/history') view = historyView();
  else if (route === '/settings') view = settingsView();
  else if (route === '/daily') view = dailyView();
  else if (route === '/welcome') view = welcomeView();
  else if ((m = route.match(/^\/ghazal\/(\d+)$/))) view = ghazalView(+m[1], q, q.get('src'));
  else view = notFoundView();

  current = view;
  main.innerHTML = view.html;
  document.title = `${view.title} · فال حافظ`;
  document.body.classList.toggle('is-welcome', route === '/welcome');
  document.querySelectorAll('.nav a').forEach((a) => {
    const on = a.getAttribute('href') === `#${route}` || (a.getAttribute('href') === '#/diwan' && route.startsWith('/ghazal') && !q.get('src'));
    a.toggleAttribute('aria-current', on);
    if (on) a.setAttribute('aria-current', 'page');
  });
  if (!keepScroll) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
  if (view.mount) view.mount();
}
window.addEventListener('hashchange', () => render());

/* ---------- events ---------- */
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const id = +el.dataset.id;

  switch (act) {
    case 'draw': {
      if (el.disabled) return;
      el.disabled = true;
      el.classList.add('drawing');
      el.querySelector('.medal-label').textContent = 'غزل در حال باز شدن';
      if (navigator.vibrate) navigator.vibrate(30);
      setTimeout(() => goToFal(true), reducedMotion() ? 150 : 1700);
      break;
    }
    case 'redraw': goToFal(true); break;
    case 'fav': {
      const on = store.toggleFav(id);
      el.setAttribute('aria-pressed', String(on));
      el.innerHTML = `${ic('bookmark', on ? 'filled' : '')}<span>${on ? 'نشان شد' : 'نشان کردن'}</span>`;
      toast(on ? 'به نشان‌شده‌ها اضافه شد' : 'از نشان‌شده‌ها برداشته شد');
      break;
    }
    case 'unfav': store.toggleFav(id); render(true); break;
    case 'copy': toast((await copyPoem(poems[id - 1], tabirPlain(poems[id - 1]))) ? 'غزل و تعبیر کپی شد' : 'کپی نشد. متن را دستی انتخاب کنید.'); break;
    case 'share': {
      const r = await sharePoem(poems[id - 1], tabirPlain(poems[id - 1]));
      if (r === 'copied') toast('متن کپی شد، حالا می‌توانید بفرستید');
      else if (r === 'failed') toast('ارسال نشد. دوباره تلاش کنید.');
      break;
    }
    case 'card': {
      el.disabled = true;
      const r = await shareCard(poems[id - 1]);
      el.disabled = false;
      if (r === 'downloaded') toast('تصویر ذخیره شد');
      else if (r === 'failed') toast('ساخت تصویر ناموفق بود');
      break;
    }
    case 'more': diwanState.limit += 80; current.rerender && current.rerender(); break;
    case 'clear-history':
      openDialog('پاک کردن تاریخچه', `<p>همهٔ فال‌های ثبت‌شده پاک می‌شود. نشان‌شده‌ها حفظ می‌ماند.</p>
        <div class="btn-row"><button class="btn btn-primary" data-act="confirm-clear">پاک کن</button><button class="btn btn-quiet" data-act="close-dialog">انصراف</button></div>`);
      break;
    case 'confirm-clear': store.clearHistory(); dlg.close(); render(true); toast('تاریخچه پاک شد'); break;
    case 'install': installApp(); break;
    case 'theme-toggle': store.set('theme', resolvedTheme() === 'dark' ? 'light' : 'dark'); applyPrefs(); if (parseHash().path === '/settings') render(true); break;
    case 'test-notify': {
      if (notify.permission() === 'default') await notify.requestPermission();
      const ok = await notify.showTest(poems).catch(() => false);
      toast(ok ? 'اعلان آزمایشی فرستاده شد' : 'اعلان مجاز نیست. اجازه را در مرورگر بررسی کنید.');
      const n = $('#perm-note'); if (n) n.textContent = permissionText();
      break;
    }
    case 'ics': notify.downloadCalendarFile(); toast('فایل تقویم ساخته شد. آن را باز کنید تا به تقویم اضافه شود.'); break;
    case 'replay': slideIndex = 0; location.hash = '#/welcome'; break;
    case 'onb-next': moveSlide(1); break;
    case 'onb-prev': moveSlide(-1); break;
    case 'onb-finish': finishOnboarding(); break;
    case 'onb-reminder': if (await enableReminder()) render(true); break;
    case 'retry': render(); break;
    default: break;
  }
});

main.addEventListener('change', async (e) => {
  const el = e.target;
  const key = el.dataset.set;
  if (!key) return;
  if (key === 'theme') { store.set('theme', el.value); applyPrefs(); }
  else if (key === 'size') { store.set('size', +el.value); applyPrefs(); }
  else if (key === 'tabir') {
    store.set('tabir', +el.value);
    const p = poems[+el.closest('.tabir').dataset.id - 1];
    $('#tabir-body').innerHTML = tabirBody(p);
  }
  else if (key === 'sound') store.set('sound', el.checked);
  else if (key === 'rem-on') {
    if (el.checked) { if (!(await enableReminder())) el.checked = false; } else disableReminder();
    const n = $('#perm-note'); if (n) n.textContent = permissionText();
  } else if (key === 'rem-time') {
    if (!el.value) return;
    store.patchReminder({ time: el.value });
    notify.schedule(poems);
    notify.syncWorker();
    toast(`یادآور روی ساعت ${el.value.split(':').map((x) => fa(+x).padStart(2, '۰')).join(':')} تنظیم شد`);
  }
});

document.addEventListener('keydown', (e) => {
  if (parseHash().path !== '/welcome' || dlg.open) return;
  if (e.key === 'ArrowLeft') moveSlide(1);
  if (e.key === 'ArrowRight') moveSlide(-1);
});

window.addEventListener('hafez:reminder', () => toast('فال امروز آماده است', { href: '#/daily', label: 'ببینید' }));
document.addEventListener('visibilitychange', () => { if (!document.hidden && poems.length) notify.schedule(poems); });

/* ---------- boot ---------- */
function buildChrome() {
  $('#nav-list').innerHTML = NAV.map(([href, label, icon]) => `<li><a href="${href}">${ic(icon)}<span>${label}</span></a></li>`).join('');
  $('#rule').innerHTML = lozengeRule();
}

buildChrome();
applyPrefs();
updateInstallButton();
render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(() => notify.syncWorker()).catch(() => {});
  });
}
