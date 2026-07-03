import { build } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outdir = path.join(__dirname, "dist");

build({
  entryPoints: [path.join(__dirname, "src/standalone.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: path.join(outdir, "bundle.js"),
  format: "cjs",
  sourcemap: false,
  minify: true,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  banner: {
    js: "#!/usr/bin/env node",
  },
})
  .then(() => {
    console.log("Server bundle built:", path.join(outdir, "bundle.js"));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
