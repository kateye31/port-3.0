// Katrina's local time (Orlando, America/New_York) drives the home colour
// field and the room's light. Keyframes are blended by the hour.
const ZONE = 'America/New_York';

const KEYS = [
  // hour, home ground, ink, sun colour, sun strength, sun height, window-light strength, ambient
  [0, '#2B2452', '#FFF4EA', '#9DB2FF', .35, .55, .22, .26],
  [5.5, '#3B2F63', '#FFF4EA', '#B8B4FF', .45, .6, .25, .3],
  [6.5, '#F7B6C9', '#1E1631', '#FFB38A', 1.6, .35, .75, .45],
  [9, '#FFD7B0', '#1E1631', '#FFF0D6', 2.6, .75, .7, .6],
  [13, '#FFC49B', '#1E1631', '#FFF4E0', 3.0, 1, .55, .62],
  [17, '#FFB07D', '#1E1631', '#FFC38A', 2.8, .55, .95, .55],
  [19, '#F28D8D', '#1E1631', '#FF9A6B', 1.7, .25, 1, .45],
  [20.25, '#9C7BD0', '#FFF4EA', '#C7A0FF', .8, .3, .45, .34],
  [21.5, '#2B2452', '#FFF4EA', '#9DB2FF', .35, .55, .22, .26],
  [24, '#2B2452', '#FFF4EA', '#9DB2FF', .35, .55, .22, .26],
];

export function orlandoNow(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
    .formatToParts(date).map(p => [p.type, p.value]));
  const hour = Number(parts.hour) + Number(parts.minute) / 60;
  const label = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hour: 'numeric', minute: '2-digit' }).format(date).toLowerCase();
  return { hour, label };
}

export function lightAt(hour) {
  let i = 0; while (i < KEYS.length - 2 && hour >= KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1], t = (hour - a[0]) / (b[0] - a[0] || 1);
  const mix = (x, y) => x + (y - x) * t;
  const night = hour < 6.2 || hour >= 20.6;
  return {
    ground: mixHex(a[1], b[1], t), ink: t < .5 ? a[2] : b[2],
    sunColor: mixHex(a[3], b[3], t), sun: mix(a[4], b[4]), height: mix(a[5], b[5]),
    shafts: mix(a[6], b[6]), ambient: mix(a[7], b[7]), night,
    phase: night ? 'night' : hour < 9 ? 'morning' : hour < 16.5 ? 'afternoon' : hour < 19.5 ? 'golden hour' : 'evening',
  };
}

function mixHex(x, y, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = [p(x), p(y)];
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
