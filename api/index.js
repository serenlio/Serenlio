// Vercel runs this file as an ES module because
// the project has `"type": "module"` in package.json.
// Use ESM import syntax and export a default handler
// so Vercel treats this as a Serverless Function
// instead of a static file (which caused downloads).

import server from "../dist/index.cjs";

const { app, routesReady } = server;

export default async function handler(req, res) {
  await routesReady;
  app(req, res);
}
