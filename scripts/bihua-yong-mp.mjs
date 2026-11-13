// Emit the MetaPost programs for the pilot (永 + the 笔形 forms check)
// into demo/bihua-mp/, and run them if an `mpost` binary is available.
// The programs input the reusable module at src/bihua/mp/bihua.mp.
//
// Usage: node scripts/bihua-yong-mp.mjs

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { metaPostFormsProgram, metaPostProgram, yong } from "../dist/bihua/index.js";

const outDir = new URL("../demo/bihua-mp/", import.meta.url);
mkdirSync(outDir, { recursive: true });
copyFileSync(new URL("../src/bihua/mp/bihua.mp", import.meta.url), new URL("bihua.mp", outDir));
writeFileSync(new URL("yong.mp", outDir), metaPostProgram(yong));
writeFileSync(new URL("forms.mp", outDir), metaPostFormsProgram());
console.log("wrote demo/bihua-mp/{bihua.mp,yong.mp,forms.mp}");

try {
  execFileSync("mpost", ["-interaction=nonstopmode", "yong.mp"], {
    cwd: new URL("../demo/bihua-mp/", import.meta.url),
    stdio: "pipe",
  });
  execFileSync("mpost", ["-interaction=nonstopmode", "forms.mp"], {
    cwd: new URL("../demo/bihua-mp/", import.meta.url),
    stdio: "pipe",
  });
  console.log("mpost: rendered yong-1.svg and forms-1.svg");
} catch (e) {
  console.log("mpost: NOT RUN (binary unavailable) — programs emitted, run pending.");
}
