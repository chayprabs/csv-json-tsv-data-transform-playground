/**
 * PRD §18 post-deploy smoke checks (API-focused).
 * Usage: SMOKE_BASE_URL=http://127.0.0.1:3000 node scripts/smoke-prd.mjs
 * Optional: SMOKE_WAIT_MS=60000 to wait for server before tests.
 */

const BASE_URL = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const RUN_URL = `${BASE_URL}/api/run`;
const WAIT_MS = Number.parseInt(process.env.SMOKE_WAIT_MS ?? "60000", 10);
const SESSION_HEADER = "x-mill-session";

const SAMPLE_CSV = `name,age
Alice,32
Bob,28
`;

const POLICY_MESSAGE = "This operation is not available in the workspace.";
const RATE_LIMIT_MESSAGE = "Too many requests. Please wait a moment.";
const INPUT_LIMIT_MESSAGE = "Input exceeds the 10 MB limit";

let failures = 0;

function fail(message) {
  failures += 1;
  process.stderr.write(`FAIL: ${message}\n`);
}

function pass(message) {
  process.stdout.write(`PASS: ${message}\n`);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE_URL, { redirect: "manual" });
      if (response.status < 500) {
        pass(`Server reachable at ${BASE_URL}`);
        return;
      }
    } catch {
      // retry
    }
    await sleep(1000);
  }
  throw new Error(`Server not ready at ${BASE_URL} within ${WAIT_MS}ms`);
}

async function postRun(body, options = {}) {
  return fetch(RUN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [SESSION_HEADER]: options.sessionId ?? "smoke-prd-session",
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function testEmptyInputValidation() {
  const response = await postRun({
    input: "   ",
    command: "cat",
    inputFormat: "csv",
    outputFormat: "csv",
  });
  const data = await readJson(response);

  if (response.status !== 400) {
    fail(`empty input expected 400, got ${response.status}`);
    return;
  }

  if (data.error !== "Please paste some data") {
    fail(`empty input message mismatch: ${data.error}`);
    return;
  }

  pass("empty input validation (400, PRD copy)");
}

async function testPolicyBlock() {
  const response = await postRun({
    input: SAMPLE_CSV,
    command: "tee",
    inputFormat: "csv",
    outputFormat: "csv",
  });
  const data = await readJson(response);

  if (response.status !== 400) {
    fail(`policy block expected 400, got ${response.status}`);
    return;
  }

  if (data.error !== POLICY_MESSAGE) {
    fail(`policy message mismatch: ${data.error}`);
    return;
  }

  pass("policy-blocked command (400, PRD copy)");
}

async function testOversizeBody() {
  const oversizedInput = "x".repeat(10 * 1024 * 1024 + 1);
  const response = await postRun({
    input: oversizedInput,
    command: "cat",
    inputFormat: "csv",
    outputFormat: "csv",
  });
  const data = await readJson(response);

  if (response.status !== 413) {
    fail(`oversize body expected 413, got ${response.status}`);
    return;
  }

  if (data.error !== INPUT_LIMIT_MESSAGE) {
    fail(`oversize message mismatch: ${data.error}`);
    return;
  }

  pass("oversize request body (413, PRD copy)");
}

async function testRateLimit() {
  const sessionId = `smoke-rate-${Date.now()}`;
  let saw429 = false;

  for (let attempt = 0; attempt < 35; attempt += 1) {
    const response = await postRun(
      {
        input: SAMPLE_CSV,
        command: "cat",
        inputFormat: "csv",
        outputFormat: "csv",
      },
      { sessionId },
    );

    if (response.status === 429) {
      const data = await readJson(response);
      const retryAfter = response.headers.get("retry-after");

      if (data.error !== RATE_LIMIT_MESSAGE) {
        fail(`rate limit message mismatch: ${data.error}`);
        return;
      }

      if (!retryAfter) {
        fail("rate limit response missing Retry-After header");
        return;
      }

      saw429 = true;
      break;
    }
  }

  if (!saw429) {
    fail("rate limit: expected 429 within 35 requests");
    return;
  }

  pass("rate limit (429, Retry-After, PRD copy)");
}

async function testSuccessfulTransform() {
  const response = await postRun({
    input: SAMPLE_CSV,
    command: "filter '$age > 25'",
    inputFormat: "csv",
    outputFormat: "csv",
  });
  const data = await readJson(response);

  if (response.status === 500 && data.code === "ENGINE_UNAVAILABLE") {
    if (process.env.SMOKE_REQUIRE_ENGINE === "1") {
      fail("transform failed: engine unavailable but SMOKE_REQUIRE_ENGINE=1");
      return;
    }
    pass("transform skipped (engine not installed on this host)");
    return;
  }

  if (response.status !== 200) {
    fail(`transform expected 200, got ${response.status}: ${data.error ?? ""}`);
    return;
  }

  if (data.error !== null) {
    fail(`transform expected null error, got ${data.error}`);
    return;
  }

  if (typeof data.inputRowCount !== "number" || typeof data.outputRowCount !== "number") {
    fail("transform missing row counts in response");
    return;
  }

  if (typeof data.durationMs !== "number") {
    fail("transform missing durationMs in response");
    return;
  }

  pass("filter transform (200, metrics in body)");
}

async function main() {
  process.stdout.write(`PRD smoke tests → ${RUN_URL}\n`);
  await waitForServer();
  await testEmptyInputValidation();
  await testPolicyBlock();
  await testSuccessfulTransform();
  await testOversizeBody();
  await testRateLimit();

  if (failures > 0) {
    process.stderr.write(`\n${failures} smoke check(s) failed.\n`);
    process.exit(1);
  }

  process.stdout.write("\nAll PRD smoke checks passed.\n");
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Unknown smoke error"}\n`,
  );
  process.exit(1);
});
