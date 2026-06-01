import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ENGINE_NAME = process.platform === "win32"
  ? "transform-engine.exe"
  : "transform-engine";

function getEngineBinaryPath() {
  const configured = process.env.ENGINE_BINARY_PATH?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }

  return path.join(process.cwd(), "bin", ENGINE_NAME);
}

async function isEngineAvailable() {
  try {
    await access(getEngineBinaryPath(), fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const engineAvailable = await isEngineAvailable();

  return NextResponse.json({
    status: "ok",
    engineAvailable,
  });
}
