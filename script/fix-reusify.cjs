const fs = require("fs");
const path = require("path");

const reusifyDir = path.join(__dirname, "..", "node_modules", "reusify");
const reusifyJs = path.join(reusifyDir, "reusify.js");

const content = `'use strict'

function reusify (Constructor) {
  var head = null
  var tail = null

  function get () {
    var current = head

    if (current) {
      head = head.next
    } else {
      current = new Constructor()
    }

    current.next = tail
    tail = current

    return current
  }

  function release (obj) {
    tail = obj
  }

  return {
    get: get,
    release: release
  }
}

module.exports = reusify
`;

if (!fs.existsSync(reusifyJs) && fs.existsSync(reusifyDir)) {
  fs.writeFileSync(reusifyJs, content, "utf8");
  console.log("Created missing node_modules/reusify/reusify.js");
}
