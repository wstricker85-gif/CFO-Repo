import { readFile, access, readdir } from "node:fs/promises";
import { join } from "node:path";
const root = new URL("../out/", import.meta.url);
const base = process.env.CFO_DEMO_BASE_PATH ?? "/cfo-demo";
const routes = [
  "",
  "kpi",
  "analyse",
  "guv",
  "bilanz",
  "cashflow",
  "ifrs",
  "working-capital",
  "bewertung",
  "budget",
  "markt",
  "board",
  "daten",
  "annahmen",
  "projekt",
];
for (const route of routes) {
  const path = join(route, "index.html");
  const html = await readFile(new URL(path, root), "utf8");
  if ((html.match(/<main[\s>]/g) ?? []).length !== 1)
    throw new Error(`Missing main landmark in ${path}`);
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const url = match[1].split(/[?#]/)[0];
    if (!url.startsWith(`${base}/`)) continue;
    let file = url.slice(base.length + 1);
    if (!/\.[a-z0-9]+$/i.test(file)) file = join(file, "index.html");
    await access(new URL(file, root));
  }
}
await access(new URL("api/market.php", root));
let adapterFound = false;
async function bundles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) await bundles(file);
    else if (
      file.endsWith(".js") &&
      (await readFile(file, "utf8")).includes(`${base}/api/market.php`)
    )
      adapterFound = true;
  }
}
await bundles(new URL("_next/static/", root).pathname);
if (!adapterFound)
  throw new Error("Client does not target the PHP adapter under the deployment base path");
console.log(`Checked ${routes.length} routes, local links/assets and the PHP market adapter path.`);
