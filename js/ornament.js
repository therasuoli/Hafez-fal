/* Geometric ornament: a Shiraz-tile style star medallion, drawn as inline SVG. */
const C = 100;

function star(points, outer, inner, rotate = 0) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / points + rotate - Math.PI / 2;
    return `${(C + r * Math.cos(a)).toFixed(2)},${(C + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

export function medallion() {
  return `<svg class="medal" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <circle class="m-halo" cx="${C}" cy="${C}" r="98"/>
    <g class="m-ring m-ring-a"><polygon class="m-star-a" points="${star(12, 94, 74)}"/></g>
    <g class="m-ring m-ring-b"><polygon class="m-star-b" points="${star(12, 74, 56, Math.PI / 12)}"/></g>
    <circle class="m-disc" cx="${C}" cy="${C}" r="48"/>
    <g class="m-ring m-ring-c"><polygon class="m-star-c" points="${star(16, 46, 42)}"/></g>
  </svg>`;
}

/** Small decorative divider used above the footer. */
export function lozengeRule() {
  return `<svg class="rule" viewBox="0 0 120 12" aria-hidden="true" focusable="false">
    <path d="M0 6h46M74 6h46" />
    <path class="rule-gem" d="M60 0l6 6-6 6-6-6z" />
  </svg>`;
}

/** Filled star path for canvas drawing (returns array of [x, y] around 0,0). */
export function starPoints(points, outer, inner, rotate = 0) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / points + rotate - Math.PI / 2;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
}
