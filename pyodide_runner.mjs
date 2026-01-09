import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
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
      try {
        const info = pyodide.FS.stat(current);
        if (pyodide.FS.isDir(info.mode)) {
          continue;
        }
      } catch {
        // ignore stat failures and rethrow the original error
      }
      throw err;
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

async function exportTree(srcDir, destDir) {
  await mkdir(destDir, { recursive: true });
  const entries = pyodide.FS.readdir(srcDir).filter((name) => name !== "." && name !== "..");
  for (const name of entries) {
    const srcPath = path.posix.join(srcDir, name);
    const destPath = path.join(destDir, name);
    const stats = pyodide.FS.stat(srcPath);
    if (pyodide.FS.isDir(stats.mode)) {
      await exportTree(srcPath, destPath);
    } else {
      const data = pyodide.FS.readFile(srcPath);
      await mkdir(path.dirname(destPath), { recursive: true });
      await writeFile(destPath, data);
    }
  }
}

try {
  await ensureDir("/data");
  await ensureDir("/data/outputs");
  if (filesDir) {
    try {
      const stats = await stat(filesDir);
      if (stats.isDirectory()) {
        await copyTree(filesDir, "/data");
      }
    } catch (err) {
      let detail = err?.stack || err?.message;
      if (!detail) {
        try {
          detail = JSON.stringify(err);
        } catch {
          detail = String(err);
        }
      }
      stderrChunks.push(
        `Failed to load session files from ${filesDir}: ${detail}`
      );
    }
  }
  await pyodide.runPythonAsync(code);
  if (filesDir) {
    try {
      await exportTree("/data", filesDir);
    } catch (err) {
      const detail = err?.stack || err?.message || String(err);
      stderrChunks.push(
        `Failed to export session files to ${filesDir}: ${detail}`
      );
    }
  }
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
