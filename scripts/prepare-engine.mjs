import { chmod, copyFile, mkdir, readdir, rename, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const binDir = path.join(projectRoot, "bin");
const engineName = process.platform === "win32"
  ? "transform-engine.exe"
  : "transform-engine";
const enginePath = path.join(binDir, engineName);

function writeMessage(stream, message) {
  stream.write(`${message}\n`);
}

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function findFallbackBinary() {
  if (!(await exists(binDir))) {
    return null;
  }

  const entries = await readdir(binDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile());

  if (files.length !== 1) {
    return null;
  }

  return path.join(binDir, files[0].name);
}

async function main() {
  await mkdir(binDir, { recursive: true });

  if (await exists(enginePath)) {
    if (process.platform !== "win32") {
      await chmod(enginePath, 0o755);
    }
    writeMessage(process.stdout, `Engine executable ready at ${enginePath}.`);
    return;
  }

  const sourcePath = process.env.ENGINE_BINARY_PATH;

  if (sourcePath && (await exists(sourcePath))) {
    await copyFile(sourcePath, enginePath);

    if (process.platform !== "win32") {
      await chmod(enginePath, 0o755);
    }

    writeMessage(process.stdout, `Prepared engine executable at ${enginePath}.`);
    return;
  }

  const fallbackBinary = await findFallbackBinary();

  if (fallbackBinary && fallbackBinary !== enginePath) {
    await rename(fallbackBinary, enginePath);

    if (process.platform !== "win32") {
      await chmod(enginePath, 0o755);
    }

    writeMessage(process.stdout, `Renamed bundled executable to ${enginePath}.`);
    return;
  }

  writeMessage(
    process.stderr,
    `No engine executable was found. Place a compatible binary at ${enginePath} or set ENGINE_BINARY_PATH before install.`,
  );
}

main().catch((error) => {
  writeMessage(
    process.stderr,
    error instanceof Error ? error.message : "Unknown engine preparation error.",
  );
  process.exit(1);
});
