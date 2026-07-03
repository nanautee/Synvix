import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8")).version;

for (const rel of ["electron/package.json", "client/package.json"]) {
  const file = path.join(root, rel);
  const pkg = JSON.parse(fs.readFileSync(file, "utf-8"));
  if (pkg.version !== version) {
    pkg.version = version;
    fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
    console.log(`Updated ${rel} → ${version}`);
  }
}
