const PALETTE = [
  '#7C3AED',
  '#6D28D9',
  '#4F46E5',
  '#0F766E',
  '#C2410C',
  '#BE185D',
  '#0369A1',
  '#15803D',
  '#B45309',
  '#334155',
] as const;

function colorFromSeed(seed: string): string {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length] ?? '#7C3AED';
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function demoListingImageSvg(title: string, seed = title): string {
  const accent = colorFromSeed(seed);
  const raw = title.trim() || 'Объявление';
  const display = raw.length > 42 ? `${raw.slice(0, 40)}…` : raw;
  const label = escapeXml(display);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <text x="400" y="308" text-anchor="middle" fill="#ffffff" font-family="Inter,system-ui,sans-serif" font-size="28" font-weight="600">${label}</text>
</svg>`;
}

export function demoListingImageDataUri(title: string, seed = title): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(demoListingImageSvg(title, seed))}`;
}

export function isHotlinkPlaceholder(url: string | null | undefined): boolean {
  return Boolean(url?.includes('picsum.photos'));
}
