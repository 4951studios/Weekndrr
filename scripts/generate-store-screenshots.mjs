import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const outputs = "assets/store-screenshots";
const sources = {
  iosExplore: "/tmp/ios-home-clean.png",
  iosLaunch: "/tmp/ios-splash.png",
  androidExplore: "/tmp/and-home-clean.png",
  androidLaunch: "/tmp/and-splash.png",
};

const iosSizes = [
  { label: "6.1-inch", width: 1179, height: 2556 },
  { label: "6.5-inch", width: 1284, height: 2778 },
  { label: "6.7-inch", width: 1290, height: 2796 },
];

await mkdir(outputs, { recursive: true });

async function exportScreenshot(source, name, width, height, fit = "cover") {
  await sharp(source)
    .resize(width, height, {
      fit,
      position: "centre",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png({ compressionLevel: 9 })
    .toFile(`${outputs}/${name}-${width}x${height}.png`);
}

for (const size of iosSizes) {
  await exportScreenshot(
    sources.iosExplore,
    `ios-explore-${size.label}`,
    size.width,
    size.height
  );
  await exportScreenshot(
    sources.iosLaunch,
    `ios-launch-${size.label}`,
    size.width,
    size.height
  );
}

await exportScreenshot(sources.androidExplore, "android-explore", 1080, 1920, "contain");
await exportScreenshot(sources.androidLaunch, "android-launch", 1080, 1920, "contain");

console.log(`Generated store screenshots in ${outputs}/`);
