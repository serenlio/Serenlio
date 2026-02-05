import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Use process.cwd() on Vercel; __dirname works locally (dist/)
  const distPath = process.env.VERCEL
    ? path.join(process.cwd(), "dist", "public")
    : path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath, { index: "index.html" }));

  // SPA fallback: serve index.html with explicit Content-Type (prevents download on Vercel)
  app.get("*", (_req, res) => {
    const htmlPath = path.join(distPath, "index.html");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(fs.readFileSync(htmlPath, "utf-8"));
  });
}
