import { defineConfig } from "tsup";

export default defineConfig([
  // build standard (dev-friendly)
  {
    entry: ["ts/index.ts"],
    outDir: "dist",
    format: ["esm"],
    target: "es2022",
    bundle: true,
    splitting: false,
    sourcemap: false, // important ici
    clean: true,
    dts: true,
    minify: false,
    noExternal: [/.*/],
  },

  // build dev (avec sourcemap)
  {
    entry: ["ts/index.ts"],
    outDir: "dist/dev",
    format: ["esm"],
    target: "es2022",
    bundle: true,
    splitting: false,
    sourcemap: true,
    clean: false, // ⚠️ surtout pas clean ici
    dts: false,   // inutile en double
    minify: false,
    noExternal: [/.*/],
  }
]);
