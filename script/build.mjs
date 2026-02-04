/**
 * Server-only build step (run after "vite build").
 * Avoids tsx/get-tsconfig/resolve-pkg-maps ESM resolution issues on Windows.
 */
import { build as esbuild } from "esbuild";
import { rm, readFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const allowlist = [
  "@google/generative-ai", "axios", "connect-pg-simple", "cors", "date-fns",
  "drizzle-orm", "drizzle-zod", "express", "express-rate-limit", "express-session",
  "jsonwebtoken", "memorystore", "multer", "nanoid", "nodemailer", "openai",
  "passport", "passport-local", "pg", "stripe", "uuid", "ws", "xlsx", "zod",
  "zod-validation-error",
];

async function buildServer() {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: [path.join(root, "server/index.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.join(root, "dist/index.cjs"),
    define: { "process.env.NODE_ENV": '"production"' },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
