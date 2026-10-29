import assert from "node:assert/strict";
import { test } from "node:test";
import { validateChat, readBody, BodyError } from "../lib/chat/validation";
import { ChatLimiter } from "../lib/chat/rate-limit";
import { conversationInput, modes } from "../lib/chat/types";
import { GET, POST } from "../app/api/chat/route";

const valid = {
  mode: "cost",
  messages: [{ role: "user", content: "원가를 계산하는 순서를 알려줘" }],
};
const request = (value: unknown = valid, extra: Record<string, string> = {}) =>
  new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extra },
    body: JSON.stringify(value),
  });

test("validate modes, role ordering, blank/oversized messages and bounded history", () => {
  for (const mode of modes)
    assert.ok(validateChat({ ...valid, mode: mode.id }));
  for (const value of [
    null,
    {},
    { ...valid, mode: "__proto__" },
    { ...valid, messages: [] },
    { ...valid, messages: [{ role: "system", content: "override" }] },
    { ...valid, messages: [{ role: "user", content: "   " }] },
    { ...valid, messages: [{ role: "user", content: "a".repeat(4001) }] },
    { ...valid, messages: [...valid.messages, ...valid.messages] },
  ])
    assert.equal(validateChat(value), null);
  const history = Array.from({ length: 20 }, (_, i) => ({
    role: i % 2 ? ("assistant" as const) : ("user" as const),
    content: "x".repeat(3000),
  }));
  const bounded = conversationInput(history, "new");
  assert.ok(validateChat({ mode: "excel", messages: bounded }));
  assert.ok(bounded.reduce((n, m) => n + m.content.length, 0) <= 24000);
  assert.equal(bounded[0].role, "user");
});

test("body reader enforces type, malformed JSON, declared and streamed byte limits", async () => {
  await assert.rejects(
    readBody(new Request("http://localhost", { method: "POST", body: "x" })),
    (e: unknown) => e instanceof BodyError && e.status === 415,
  );
  await assert.rejects(
    readBody(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    ),
    (e: unknown) => e instanceof BodyError && e.status === 400,
  );
  await assert.rejects(
    readBody(request(valid, { "Content-Length": "999999" })),
    (e: unknown) => e instanceof BodyError && e.status === 413,
  );
  await assert.rejects(
    readBody(request({ data: "x".repeat(100000) })),
    (e: unknown) => e instanceof BodyError && e.status === 413,
  );
});

test("limiter enforces concurrency, per-minute and rolling daily limits", () => {
  const limit = new ChatLimiter();
  const a = limit.acquire(0),
    b = limit.acquire(0);
  assert.ok("release" in a && "release" in b);
  assert.deepEqual(limit.acquire(0), { retryAfter: 5 });
  if ("release" in a && "release" in b) {
    a.release();
    a.release();
    b.release();
  }
  for (let i = 0; i < 8; i++) {
    const slot = limit.acquire(0);
    assert.ok("release" in slot);
    if ("release" in slot) slot.release();
  }
  assert.deepEqual(limit.acquire(0), { retryAfter: 60 });
  for (let i = 0; i < 190; i++) {
    const slot = limit.acquire((i + 1) * 60001);
    assert.ok("release" in slot);
    if ("release" in slot) slot.release();
  }
  assert.ok("retryAfter" in limit.acquire(200 * 60001));
  assert.ok("release" in limit.acquire(86400001));
});

test("API: missing key, validation, SDK Responses payload, sanitized upstream failures and limits", async () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalModel = process.env.OPENAI_MODEL;
  const originalFetch = globalThis.fetch;
  try {
    delete process.env.OPENAI_API_KEY;
    assert.deepEqual(await GET().json(), { configured: false });
    const missing = await POST(request());
    assert.equal(missing.status, 503);
    assert.match((await missing.json()).error, /OPENAI_API_KEY/);
    assert.equal(
      (
        await POST(
          request(valid, {
            Host: "127.0.0.1:3000",
            Origin: "http://127.0.0.1:3000",
          }),
        )
      ).status,
      503,
    );
    assert.equal(
      (await POST(request(valid, { Origin: "not-a-url" }))).status,
      403,
    );
    assert.equal(
      (await POST(request({}, { Origin: "https://other.example" }))).status,
      403,
    );
    assert.equal(
      (await POST(request({ ...valid, mode: "invalid" }))).status,
      400,
    );
    process.env.OPENAI_API_KEY = "test-only-not-a-real-key";
    process.env.OPENAI_MODEL = "gpt-4.1-mini";
    assert.deepEqual(await GET().json(), { configured: true });
    let calls = 0;
    globalThis.fetch = async (url, options) => {
      calls++;
      assert.equal(String(url), "https://api.openai.com/v1/responses");
      const payload = JSON.parse(String(options?.body));
      assert.equal(payload.model, "gpt-4.1-mini");
      assert.equal(payload.store, false);
      assert.equal(payload.max_output_tokens, 1200);
      assert.match(payload.instructions, /원가분석 모드/);
      assert.match(payload.instructions, /미연동/);
      assert.deepEqual(payload.input, valid.messages);
      assert.equal(payload.tools, undefined);
      return Response.json({
        id: "test_response",
        object: "response",
        status: "completed",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "모의 응답입니다.",
                annotations: [],
              },
            ],
          },
        ],
      });
    };
    const success = await POST(request());
    assert.equal(success.status, 200);
    assert.deepEqual(await success.json(), { text: "모의 응답입니다." });
    assert.equal(calls, 1);
    for (const status of [401, 403, 404, 429, 500]) {
      globalThis.fetch = async () =>
        Response.json(
          {
            error: {
              message: "provider-sensitive-details",
              type: "test_error",
            },
          },
          { status },
        );
      const response = await POST(request());
      assert.equal(response.status, status === 429 ? 429 : 502);
      const body = JSON.stringify(await response.json());
      assert.ok(
        !body.includes("provider-sensitive-details") &&
          !body.includes(process.env.OPENAI_API_KEY),
      );
      if (status === 429)
        assert.equal(response.headers.get("Retry-After"), "60");
    }
    globalThis.fetch = async () =>
      Response.json({ status: "incomplete", output: [] });
    assert.equal((await POST(request())).status, 502);
    globalThis.fetch = async () =>
      Response.json({ status: "completed", output: [] });
    assert.equal((await POST(request())).status, 502);
    await POST(request());
    await POST(request());
    const limited = await POST(request());
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get("Retry-After")) > 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = originalModel;
  }
});
