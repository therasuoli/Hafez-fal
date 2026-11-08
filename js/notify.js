/*
 * Daily reminder ("alarm") logic.
 *
 * A web app cannot ring like a native alarm clock when it is closed, so three
 * layers are used together:
 *   1. While the app is open: a timer fires a notification + chime at the set time.
 *   2. Installed PWA on supporting browsers: Periodic Background Sync wakes the
 *      service worker (see sw.js) so the notification can appear when closed.
 *   3. Calendar file (.ics): a daily repeating event with an alarm. This is the
 *      only fully reliable option on every device.
 */
import { store } from './store.js';

const S = window.HafezShared;
let timer = 0;

export const notificationsSupported = () => 'Notification' in window && 'serviceWorker' in navigator;
export const permission = () => ('Notification' in window ? Notification.permission : 'unsupported');

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}

/** Soft three-note chime, only meaningful while the page is open. */
export function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t0 = ctx.currentTime;
    [[659.25, 0], [783.99, 0.24], [987.77, 0.48]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + delay);
      gain.gain.linearRampToValueAtTime(0.2, t0 + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + 1.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + delay);
      osc.stop(t0 + delay + 1.4);
    });
    setTimeout(() => ctx.close(), 2800);
  } catch { /* audio blocked: ignore */ }
}

async function show(poem) {
  const n = S.notice(poem);
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification(n.title, n.options);
}

/** Fire the reminder once per day, whichever layer gets there first. */
async function fire(poems) {
  const day = S.dayKey();
  let last = null;
  try { last = await S.kvGet('lastNotified'); } catch { /* ignore */ }
  if (last === day) return schedule(poems);
  try { await S.kvSet('lastNotified', day); } catch { /* ignore */ }

  const poem = poems[S.dailyIndex(day, poems.length)];
  if (permission() === 'granted') { try { await show(poem); } catch { /* ignore */ } }
  if (store.get('sound')) chime();
  window.dispatchEvent(new CustomEvent('hafez:reminder'));
  schedule(poems);
}

/** (Re)arm the in-page timer for the next occurrence of the reminder time. */
export function schedule(poems) {
  clearTimeout(timer);
  const r = store.get('reminder');
  if (!r.on || !poems.length) return;
  const now = new Date();
  const next = new Date(now);
  const [h, m] = r.time.split(':');
  next.setHours(+h, +m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  timer = setTimeout(() => fire(poems), next - now);
}

/** Mirror settings for the service worker and (un)register background sync. */
export async function syncWorker() {
  const r = store.get('reminder');
  try { await S.kvSet('reminder', r); } catch { /* ignore */ }
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.periodicSync) return;
    if (r.on && permission() === 'granted') {
      await reg.periodicSync.register('daily-fal', { minInterval: 12 * 60 * 60 * 1000 });
    } else {
      await reg.periodicSync.unregister('daily-fal');
    }
  } catch { /* not installed / not allowed */ }
}

export async function showTest(poems) {
  if (permission() !== 'granted') return false;
  const poem = poems[S.dailyIndex(S.dayKey(), poems.length)];
  await show(poem);
  if (store.get('sound')) chime();
  return true;
}

/** Daily repeating calendar event with an alarm at the reminder time. */
export function downloadCalendarFile() {
  const r = store.get('reminder');
  const [h, m] = r.time.split(':').map(Number);
  const start = new Date();
  start.setHours(h, m, 0, 0);
  if (start <= new Date()) start.setDate(start.getDate() + 1);

  const p2 = (n) => String(n).padStart(2, '0');
  const local = `${start.getFullYear()}${p2(start.getMonth() + 1)}${p2(start.getDate())}T${p2(h)}${p2(m)}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const url = location.origin + location.pathname;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hafez Fal//FA',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:daily-fal@hafez-fal-app',
    `DTSTAMP:${stamp}`,
    `DTSTART:${local}`,
    'DURATION:PT10M',
    'RRULE:FREQ=DAILY',
    'SUMMARY:فال حافظ',
    `DESCRIPTION:وقت فال امروز است. ${url}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:فال حافظ',
    'TRIGGER:PT0S',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hafez-fal-daily.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
