/* Share a ghazal as text or as a picture card. */
import { starPoints } from './ornament.js';

const W = 1080;
const H = 1350;

function fitFont(ctx, text, maxWidth, size, weight, family) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${family}`;
    s -= 2;
  } while (ctx.measureText(text).width > maxWidth && s > 28);
}

function drawStar(ctx, cx, cy, points, outer, inner, rotate, fill, stroke) {
  const pts = starPoints(points, outer, inner, rotate);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y)));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
}

/** Render the first two beyts onto a 1080x1350 card and return a PNG blob. */
export async function makeCard(poem) {
  try {
    await Promise.all([
      document.fonts.load('600 54px "Noto Naskh Arabic"', 'حافظ'),
      document.fonts.load('400 96px "Aref Ruqaa"', 'فال'),
      document.fonts.load('500 30px Vazirmatn', 'غزل')
    ]);
  } catch { /* fall back to whatever is available */ }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0c1730');
  bg.addColorStop(1, '#16275a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const gold = '#e2b857';
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, W - 96, H - 96);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(64, 64, W - 128, H - 128);

  drawStar(ctx, W / 2, 210, 12, 92, 72, 0, null, gold);
  drawStar(ctx, W / 2, 210, 12, 70, 54, Math.PI / 12, null, 'rgba(226,184,87,.55)');
  drawStar(ctx, W / 2, 210, 8, 38, 24, 0, gold, null);

  ctx.fillStyle = '#f1ecdc';
  ctx.font = '400 92px "Aref Ruqaa", "Noto Naskh Arabic", serif';
  ctx.fillText('فال حافظ', W / 2, 380);
  ctx.fillStyle = gold;
  ctx.font = '500 34px Vazirmatn, sans-serif';
  ctx.fillText(`غزل ${poem.id.toLocaleString('fa-IR', { useGrouping: false })}`, W / 2, 452);

  const lines = poem.v.slice(0, 6);
  let y = 565;
  lines.forEach((line, i) => {
    ctx.fillStyle = '#f1ecdc';
    fitFont(ctx, line, W - 240, 56, 600, '"Noto Naskh Arabic", "Vazirmatn", serif');
    ctx.fillText(line, W / 2, y);
    if (i % 2 === 0) {
      y += 100;
    } else if (i < lines.length - 1) {
      drawStar(ctx, W / 2, y + 75, 4, 14, 6, 0, gold, null);
      y += 150;
    }
  });

  ctx.direction = 'ltr';
  ctx.fillStyle = 'rgba(241,236,220,.7)';
  ctx.font = '400 28px Vazirmatn, sans-serif';
  ctx.fillText('Designed & Developed by Hadi Rasouli', W / 2, H - 108);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export function poemText(poem) {
  const lines = [];
  for (let i = 0; i < poem.v.length; i += 2) lines.push(poem.v[i] + (poem.v[i + 1] ? ' ... ' + poem.v[i + 1] : ''));
  return lines.join('\n');
}

export async function sharePoem(poem, interpretation = poem.t) {
  const url = location.origin + location.pathname;
  const text = `فال حافظ، غزل ${poem.id.toLocaleString('fa-IR', { useGrouping: false })}\n\n${poemText(poem)}\n\n${interpretation}\n${url}`;
  if (navigator.share) {
    try { await navigator.share({ title: 'فال حافظ', text }); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  return copyText(text) ? 'copied' : 'failed';
}

export async function copyPoem(poem, interpretation = poem.t) {
  return copyText(`${poemText(poem)}\n\n${interpretation}`);
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* try legacy */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}

export async function shareCard(poem) {
  const blob = await makeCard(poem);
  if (!blob) return 'failed';
  const file = new File([blob], `hafez-fal-${poem.id}.png`, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'فال حافظ' }); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
