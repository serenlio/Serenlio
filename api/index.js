const { app, routesReady } = require("../dist/index.cjs");

module.exports = async (req, res) => {
  await routesReady;
  app(req, res);
};
