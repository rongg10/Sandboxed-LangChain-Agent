import { readFile } from "node:fs/promises";
import { loadPyodide } from "pyodide";

const scriptPath = process.argv[2];
if (!scriptPath) {
  console.error("Missing script path.");
  process.exit(2);
}

const code = await readFile(scriptPath, "utf8");

const stdoutChunks = [];
const stderrChunks = [];

const options = {};
const indexURL = process.env.PYODIDE_INDEX_URL;
if (indexURL) {
  options.indexURL = indexURL.endsWith("/") ? indexURL : `${indexURL}/`;
}

let pyodide;
try {
  pyodide = await loadPyodide(options);
} catch (err) {
  if (indexURL) {
    console.error(`Failed to load Pyodide from ${options.indexURL}.`);
  } else {
    console.error("Failed to load Pyodide from local package assets.");
  }
  console.error(err?.stack || String(err));
  process.exit(1);
}

pyodide.setStdout({
  batched: (msg) => stdoutChunks.push(msg),
});
pyodide.setStderr({
  batched: (msg) => stderrChunks.push(msg),
});

try {
  await pyodide.runPythonAsync(code);
} catch (err) {
  stderrChunks.push(err?.stack || String(err));
  const stderr = stderrChunks.join("");
  if (stderr) {
    process.stderr.write(stderr);
  }
  process.exit(1);
}

const stdout = stdoutChunks.join("");
const stderr = stderrChunks.join("");
if (stdout) {
  process.stdout.write(stdout);
}
if (stderr) {
  process.stderr.write(stderr);
}
