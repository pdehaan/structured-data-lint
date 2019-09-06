#!/usr/bin/env node

const lib = require("./lib");
const args = process.argv.slice(2);

main(...args);

async function main(glob) {
  await lib.lint(glob, { pretty: false });
}
