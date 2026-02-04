import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async () => {
  const plugins = [react()];
  if (process.env.REPL_ID) {
    const runtimeErrorOverlay = (await import("@replit/vite-plugin-runtime-error-modal")).default;
    plugins.push(runtimeErrorOverlay());
    plugins.push((await import("@replit/vite-plugin-cartographer")).cartographer());
    plugins.push((await import("@replit/vite-plugin-dev-banner")).devBanner());
  }
  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
        "tailwind-merge": path.resolve(import.meta.dirname, "node_modules", "tailwind-merge", "dist", "bundle-cjs.js"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
