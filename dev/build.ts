import { Glob } from "bun";
import { rm } from "node:fs/promises";

await rm("./public/js", { recursive: true, force: true });

const glob = new Glob("**/*.{ts,tsx,js,jsx}");
const entrypoints: string[] = [];

for await (const file of glob.scan("./src")) {
  entrypoints.push(`./src/${file}`);
}

const result = await Bun.build({
  entrypoints,
  outdir: "./public/js",
  root: "./src",
  target: "browser",
  sourcemap: "none", 
  minify: process.env.NODE_ENV === "production",
});

if (!result.success) {
  console.error("Falha no Build:");
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

console.log(`Build concluído com sucesso! ${entrypoints.length} arquivo(s) compilado(s) em public/js/`);