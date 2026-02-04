const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "node_modules", "ts-interface-checker", "dist");
const utilJs = path.join(distDir, "util.js");

const content = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VError = exports.DetailContext = exports.getIsNativeChecker = exports.NoopContext = void 0;
function getIsNativeChecker(tag) {
  return function (v) {
    return Object.prototype.toString.call(v) === tag;
  };
}
exports.getIsNativeChecker = getIsNativeChecker;
var NoopContext = (function () {
  function NoopContext() {}
  NoopContext.prototype.fail = function () {
    return false;
  };
  return NoopContext;
})();
exports.NoopContext = NoopContext;
var DetailContext = (function () {
  function DetailContext() {
    this.failures = [];
  }
  DetailContext.prototype.fail = function (name, message, severity) {
    this.failures.push({ name: name, message: message, severity: severity });
    return false;
  };
  DetailContext.prototype.getError = function (path) {
    var first = this.failures[0];
    return new Error(first ? path + ": " + first.message : "validation failed");
  };
  DetailContext.prototype.getErrorDetail = function (path) {
    return this.failures.length ? { path: path, message: this.failures[0].message } : null;
  };
  return DetailContext;
})();
exports.DetailContext = DetailContext;
function VError(message) {
  Error.call(this, message);
  this.name = "VError";
}
VError.prototype = Object.create(Error.prototype);
VError.prototype.constructor = VError;
exports.VError = VError;
`;

const typesJs = path.join(distDir, "types.js");

if (fs.existsSync(distDir)) {
  fs.writeFileSync(utilJs, content, "utf8");
  console.log("Fixed node_modules/ts-interface-checker/dist/util.js");
}

if (fs.existsSync(typesJs)) {
  let typesContent = fs.readFileSync(typesJs, "utf8");
  if (!typesContent.includes("getIsNativeChecker = util_1.getIsNativeChecker")) {
    typesContent = typesContent.replace(
      "var util_1 = require(\"./util\");",
      "var util_1 = require(\"./util\");\nvar getIsNativeChecker = util_1.getIsNativeChecker;"
    );
    fs.writeFileSync(typesJs, typesContent, "utf8");
    console.log("Patched node_modules/ts-interface-checker/dist/types.js (getIsNativeChecker)");
  }
}
