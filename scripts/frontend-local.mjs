import { localStatus } from "./local-lib.mjs";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
const status = localStatus();
const googleEnabled =
  /\[auth\.external\.google\][\s\S]*?enabled\s*=\s*true/.test(
    readFileSync("supabase/config.toml", "utf8"),
  );
// Only public browser configuration crosses this boundary. Never spread the status object.
const child = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    ...(process.argv[2] ? [process.argv[2]] : []),
    "apps/web",
    ...process.argv.slice(3),
  ],
  {
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...process.env,
      VITE_SUPABASE_URL: status.API_URL,
      VITE_SUPABASE_ANON_KEY: status.ANON_KEY,
      VITE_IDENTITY_URL: "http://127.0.0.1:4001",
      VITE_CONTENT_URL: "http://127.0.0.1:4002",
      VITE_LEARNING_URL: "http://127.0.0.1:4003",
      VITE_GOOGLE_ENABLED: String(googleEnabled),
    },
  },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => child.kill(signal));
