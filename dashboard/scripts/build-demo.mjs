import { cp, mkdtemp, rm, symlink, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Build an isolated static app; the working source and local dev server stay intact.
const root = fileURLToPath(new URL("../", import.meta.url));
const stage = await mkdtemp(join(tmpdir(), "cfo-static-"));
try {
  for (const name of [
    "src",
    "public",
    "next.config.ts",
    "tsconfig.json",
    "postcss.config.mjs",
    "package.json",
    "package-lock.json",
  ])
    await cp(join(root, name), join(stage, name), {
      recursive: true,
      filter: (source) => source !== join(root, "src/app/api"),
    });
  await symlink(join(root, "node_modules"), join(stage, "node_modules"), "dir");
  await new Promise((accept, reject) => {
    const child = spawn(
      process.execPath,
      [join(root, "node_modules/next/dist/bin/next"), "build", stage, "--webpack"],
      {
        cwd: stage,
        stdio: "inherit",
        env: { ...process.env, CFO_STATIC_EXPORT: "1" },
      },
    );
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? accept() : reject(new Error(`Static build failed (${code})`)),
    );
  });
  const output = join(stage, "out");
  await mkdir(join(output, "api"), { recursive: true });
  await cp(join(root, "deployment/all-inkl/market.php"), join(output, "api/market.php"));
  // Replacing only generated output is safe; never use a partial build for publication.
  await rm(resolve(root, "out"), { recursive: true, force: true });
  await cp(output, resolve(root, "out"), { recursive: true });
  console.log("Static demo with PHP market adapter ready in dashboard/out/.");
} finally {
  await rm(stage, { recursive: true, force: true });
}
