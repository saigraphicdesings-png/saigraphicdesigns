import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";

const root = process.cwd();
const ignoredSchemes = /^(?:https?:|mailto:|tel:|#|data:|javascript:)/i;
const files = [];

async function walk(dir) {
  for (const name of await readdir(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const path = join(dir, name);
    const info = await stat(path);
    if (info.isDirectory()) await walk(path);
    else files.push(path);
  }
}
await walk(root);

const candidates = files.filter((file) => [".html", ".css", ".js"].includes(extname(file)));
const missing = new Set();
const duplicateIds = new Set();

for (const file of candidates) {
  const source = await readFile(file, "utf8");
  const refs = [...source.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const ref of refs) {
    if (ignoredSchemes.test(ref) || ref.startsWith("//") || ref.includes("${") || /[\r\n]/.test(ref)) continue;
    const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
    if (!clean) continue;
    try { await stat(join(root, clean)); } catch { missing.add(`${file.replace(root + "/", "")}: ${clean}`); }
  }
  if (extname(file) === ".html") {
    const seen = new Set();
    for (const [, id] of source.matchAll(/\sid=["']([^"']+)["']/gi)) {
      if (seen.has(id)) duplicateIds.add(`${file.replace(root + "/", "")}: #${id}`);
      seen.add(id);
    }
  }
}

if (missing.size || duplicateIds.size) {
  if (missing.size) console.error("Missing local references:\n" + [...missing].join("\n"));
  if (duplicateIds.size) console.error("Duplicate HTML IDs:\n" + [...duplicateIds].join("\n"));
  process.exit(1);
}
console.log(`Validated ${candidates.length} site files successfully.`);
