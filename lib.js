const fs = require("fs");

const axios = require("axios");
const glob = require("glob").sync;

const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  lint
};

// Ref https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
const get = (p, o) => p.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);

/**
 *
 * @param {string} g A glob of files to lint.
 */
async function lint(g, args = {}) {
  const results = [];
  const files = glob(g);
  for (const file of files) {
    try {
      const res = await lintFile(file, args);
      if (res.errors && res.errors.length) {
        results.push(res);
      }
    } catch (err) {
      console.error(err.message);
      process.exitCode = 2;
    }
  }
  if (results.length) {
    console.log(JSON.stringify(results, null, 2));
    process.exitCode = 1;
  }
}

/**
 *
 * @param {string} file The JSON file to upload to the linter.
 * @param {int} wait How long to pause after each call.
 */
async function lintFile(file, args = {}, wait = 500) {
  const body = await loadFile(file);
  const uri = getParserUri(args);
  const headers = { "Content-Type": "text/plain" };
  const { data } = await axios.post(uri, body, { headers });
  let errors;
  if (data.hasOwnProperty("data")) {
    errors = get(["json-ld", 0, "#error"], data.data).map(error =>
      Object.entries(error).reduce(
        (obj, [key, value]) => Object.assign(obj, { [prettyKey(key)]: value }),
        {}
      )
    );
  }
  await sleep(wait);
  return { file, errors };
}

/**
 * Generate the URL to the Yandex Schema validator API.
 * @param {string} apiKey
 * @param {string} lang
 * @param {boolean} pretty
 * @param {boolean} onlyErrors
 */
function getParserUri(
  args = {},
  apiUrl = "https://validator-api.semweb.yandex.ru/v1.1/document_parser"
) {
  const _args = Object.assign(
    {},
    {
      apiKey: process.env.YANDEX_API_KEY,
      lang: "en",
      pretty: true,
      onlyErrors: true
    },
    args
  );
  const uri = new URL(apiUrl);
  uri.searchParams.set("apikey", _args.apiKey);
  uri.searchParams.set("lang", _args.lang);
  uri.searchParams.set("pretty", _args.pretty);
  uri.searchParams.set("only_errors", _args.onlyErrors);
  return uri.href;
}

/**
 * Strip any leading "#" from a key name.
 * @param {string} key
 */
function prettyKey(key) {
  return key.replace(/^#/, "");
}

/**
 * Load a JSON schema file as a string.
 * @param {string} file
 */
function loadFile(file) {
  return fs.readFileSync(file, "utf-8");
}

/**
 * Zzzzz.
 * @param {int} ms
 */
async function sleep(ms = 1500) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
