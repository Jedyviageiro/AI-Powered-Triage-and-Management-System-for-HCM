const fs = require("fs");
const path = require("path");

const cache = {};

function loadPrompt(name) {
  if (cache[name]) return cache[name];

  const filePath = path.join(__dirname, "..", "prompts", name);
  const content = fs.readFileSync(filePath, "utf8");

  cache[name] = content;
  return content;
}

module.exports = { loadPrompt };
