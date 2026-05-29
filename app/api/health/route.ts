import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";

import { execa } from "execa";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ENGINE_NAME =
  process.platform === "win32" ? "transform-engine.exe" : "transform-engine";

function getEngineBinaryPath() {
  const configured = process.env.ENGINE_BINARY_PATH?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }

  return path.join(process.cwd(), "bin", ENGINE_NAME);
}

export async function GET() {
  const enginePath = getEngineBinaryPath();
  let engineOk = false;
  let engineVersion: string | null = null;

  try {
    await access(enginePath, fsConstants.X_OK);
    engineOk = true;
    const { stdout } = await execa(enginePath, ["--version"], {
      timeout: 3000,
      env: {},
    });
    engineVersion = stdout.trim().split("\n")[0] ?? null;
  } catch {
    engineOk = false;
  }

  const status = engineOk ? 200 : 503;

  return NextResponse.json(
    {
      ok: engineOk,
      engineVersion,
      service: "mill",
    },
    { status },
  );
}
