import { spawn, spawnSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { localStatus } from "./local-lib.mjs";
const status = localStatus();
const config = readFileSync("supabase/config.toml", "utf8");
const google = /\[auth.external.google\][\s\S]*?enabled\s*=\s*true/.test(
  config,
);
const env = {
  EXPO_PUBLIC_SUPABASE_URL: status.API_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  EXPO_PUBLIC_IDENTITY_URL: "http://127.0.0.1:4001",
  EXPO_PUBLIC_CONTENT_URL: "http://127.0.0.1:4002",
  EXPO_PUBLIC_LEARNING_URL: "http://127.0.0.1:4003",
  EXPO_PUBLIC_GOOGLE_ENABLED: String(google),
  EXPO_PUBLIC_WEB_RECOVERY_URL: "http://localhost:5173/#/forgot",
  APP_ENV: "development",
};
writeFileSync(
  "apps/mobile/.env.local",
  Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n",
);
console.log(
  "Mobile local configuration written (public values only). Use USB/ADB reverse for APIs and signed audio URLs.",
);
if (process.argv.includes("--reverse")) {
  for (const port of [4001, 4002, 4003, 54321, 54324, 5173, 8081]) {
    const result = spawnSync("adb", ["reverse", `tcp:${port}`, `tcp:${port}`], {
      stdio: "inherit",
      windowsHide: true,
    });
    if (result.error || result.status !== 0)
      throw new Error(
        "ADB reverse failed. Install Android platform-tools, connect/unlock a device, then run adb devices.",
      );
  }
}
if (process.argv[2] !== "configure") {
  const require = createRequire(resolve("apps/mobile/package.json"));
  const child = spawn(
    process.execPath,
    [require.resolve("expo/bin/cli"), "start", "--dev-client", "--localhost"],
    {
      cwd: resolve("apps/mobile"),
      env: { ...process.env, ...env },
      stdio: "inherit",
      windowsHide: true,
    },
  );
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
}
