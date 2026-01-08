import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { loadPyodide } from "pyodide";

const scriptPath = process.argv[2];
const filesDir = process.argv[3];
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

async function ensureDir(dirPath) {
  const parts = dirPath.split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current += `/${part}`;
    try {
      pyodide.FS.mkdir(current);
    } catch (err) {
      if (err?.code !== "EEXIST" && err?.errno !== 17) {
        throw err;
      }
    }
  }
}

async function copyTree(srcDir, destDir) {
  await ensureDir(destDir);
  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.posix.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyTree(srcPath, destPath);
    } else if (entry.isFile()) {
      const data = await readFile(srcPath);
      await ensureDir(path.posix.dirname(destPath));
      pyodide.FS.writeFile(destPath, data);
    }
  }
}

try {
  if (filesDir) {
    try {
      const stats = await stat(filesDir);
      if (stats.isDirectory()) {
        await copyTree(filesDir, "/data");
      }
    } catch (err) {
      stderrChunks.push(`Failed to load session files: ${err?.message || err}`);
      throw err;
    }
  }
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
