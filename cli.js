#!/usr/bin/env node

const lib = require("./lib");
const args = process.argv.slice(2);

main(...args);

async function main(glob) {
  try {
    await lib.lint(glob, { pretty: false });
    // success!
  } catch (err) {
    if (Array.isArray(err.results)) {
      console.error(JSON.stringify(err.results, null, 2));
    } else {
      console.error(err.message);
    }
    process.exitCode = err.exitCode || 3;
  }
}
