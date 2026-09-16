// Generates the icon + splash source artwork consumed by @capacitor/assets.
// Run with `npm run assets`.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const INDIGO = "#4338CA";
const DEEP = "#312E9E";

const mark = (size) => {
  const s = size;
  const c = s / 2;
  return `
    <g transform="translate(${c}, ${c})">
      <circle r="${s * 0.34}" fill="none" stroke="#ffffff" stroke-width="${s * 0.055}" opacity="0.35"/>
      <path d="M ${-s * 0.26} ${-s * 0.16}
               L ${-s * 0.13} ${s * 0.2}
               L 0 ${-s * 0.05}
               L ${s * 0.13} ${s * 0.2}
               L ${s * 0.26} ${-s * 0.16}"
            fill="none" stroke="#ffffff" stroke-width="${s * 0.075}"
            stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="0" cy="${s * 0.3}" r="${s * 0.035}" fill="#F97316"/>
    </g>`;
};

const iconSvg = (size) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${INDIGO}"/>
        <stop offset="100%" stop-color="${DEEP}"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#g)"/>
    ${mark(size)}
  </svg>`;

const splashSvg = (size) => {
  const markSize = size * 0.28;
  const offset = (size - markSize) / 2;
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${INDIGO}"/>
        <stop offset="100%" stop-color="${DEEP}"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#g)"/>
    <g transform="translate(${offset}, ${offset - size * 0.05})">
      ${mark(markSize)}
    </g>
    <text x="50%" y="${size * 0.6}" text-anchor="middle"
          font-family="Helvetica, Arial, sans-serif" font-size="${size * 0.055}"
          font-weight="700" fill="#ffffff" letter-spacing="${size * 0.004}">
      Weekndrr
    </text>
    <text x="50%" y="${size * 0.645}" text-anchor="middle"
          font-family="Helvetica, Arial, sans-serif" font-size="${size * 0.023}"
          fill="#ffffff" opacity="0.75">
      Your cheapest weekend, sorted
    </text>
  </svg>`;
};

const splashDarkSvg = (size) =>
  splashSvg(size)
    .replace(`stop-color="${INDIGO}"`, 'stop-color="#1e1b4b"')
    .replace(`stop-color="${DEEP}"`, 'stop-color="#0f172a"');

await mkdir("assets", { recursive: true });

await sharp(Buffer.from(iconSvg(1024))).png().toFile("assets/icon.png");
await sharp(Buffer.from(splashSvg(2732))).png().toFile("assets/splash.png");
await sharp(Buffer.from(splashDarkSvg(2732)))
  .png()
  .toFile("assets/splash-dark.png");

// Store-listing and design-handoff exports.
await writeFile("assets/logo.svg", iconSvg(1024).trim());
await sharp(Buffer.from(iconSvg(1024)))
  .resize(512, 512)
  .png()
  .toFile("assets/icon-512-play-store.png");
await sharp(
  Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
    ${mark(1024)}
  </svg>`)
)
  .png()
  .toFile("assets/logo-mark-transparent.png");

console.log(
  [
    "assets/icon.png                    1024x1024 app icon (iOS + Android source)",
    "assets/icon-512-play-store.png     512x512 Play Store listing icon",
    "assets/logo.svg                    vector app icon",
    "assets/logo-mark-transparent.png   1024x1024 mark only, transparent",
    "assets/splash.png                  2732x2732 splash (light)",
    "assets/splash-dark.png             2732x2732 splash (dark)",
  ].join("\n")
);
