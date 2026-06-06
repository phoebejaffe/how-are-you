import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = join(root, "public/icons/icon.svg");

if (!existsSync(svg)) {
  console.error("Missing icon.svg");
  process.exit(1);
}

for (const size of [192, 512]) {
  const out = join(root, `public/icons/icon-${size}.png`);
  execSync(`sips -s format png "${svg}" --out "${out}" -z ${size} ${size}`, { stdio: "inherit" });
  console.log(`Wrote ${out}`);
}
