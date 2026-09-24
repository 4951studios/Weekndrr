import { cp, rm } from "node:fs/promises";
import { resolve } from "node:path";

const capacitorAppDirectory = resolve("ios/App/App");
const xcodeTargetDirectory = resolve("ios/App/Weekndrr");

await rm(resolve(xcodeTargetDirectory, "public"), { force: true, recursive: true });
await cp(
  resolve(capacitorAppDirectory, "public"),
  resolve(xcodeTargetDirectory, "public"),
  { recursive: true }
);
await cp(
  resolve(capacitorAppDirectory, "capacitor.config.json"),
  resolve(xcodeTargetDirectory, "capacitor.config.json")
);

console.log("Synced Capacitor assets to the Weekndrr Xcode target.");