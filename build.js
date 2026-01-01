import esbuild from "esbuild";
import copyStaticFilesPlugin from "esbuild-copy-files-plugin";

// Build background.ts

let buildDir = "dist";

esbuild.build({
  entryPoints: ["src/background.ts", "src/popup.ts"],
  bundle: true,
  outdir: buildDir,
  format: "iife",
  plugins: [
    copyStaticFilesPlugin({
      source: ["src/popup.html"],
      target: buildDir,
      copyWithFolder: false,
    }),
  ],
});
