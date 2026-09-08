import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("node-fetch", () => ({ default: vi.fn() }));

import fetch from "node-fetch";
import {
  evaluateAIQuality,
  hasCachedAiResult,
} from "./evaluateAIQuality.js";

const DB_URL =
  "http://127.0.0.1:3005/records/doi%3A10.18739%2FA2RX93F75";

const md = {
  id: "doi:10.18739/A2RX93F75",
  short_description: "short text",
  documentation: "docs text",
};

const cachedRecord = {
  short_description: "short text",
  documentation: "docs text",
  ai_result_short_description: "Good",
  ai_result_documentation: "Fair",
  ai_index_page: "true",
  ai_doc_language: "false",
  ai_doc_references: "true",
  ai_data_retrieval: "true",
  ai_retrieval_protocol: "HTTPS",
};

const aiJson = {
  short_description: "Good",
  documentation: "Good",
  index_page: "true",
  doc_language: "true",
  doc_references: "true",
  data_retrieval: "false",
  retrieval_protocol: "HTTPS",
};

const dbRes = (over = {}) => ({
  ok: over.ok ?? true,
  status: over.status ?? 200,
  headers: { get: () => null },
  json: async () => over.json,
});

const aiRes = (over = {}) => ({
  ok: over.ok ?? true,
  status: over.status ?? 200,
  headers: { get: () => null },
  json: async () => ({
    choices: [{ message: { content: over.content } }],
  }),
});

const aiContent = (obj) =>
  "```json\n" + JSON.stringify(obj) + "\n```";

describe("evaluateAIQuality", () => {
  beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
    fetch.mockReset();
  });

  it("returns the cached AI result when the database record matches", async () => {
    fetch.mockResolvedValue(dbRes({ json: cachedRecord }));

    const result = await evaluateAIQuality(md);

    expect(result).toEqual({
      short_description: "Good",
      documentation: "Fair",
      index_page: "true",
      doc_language: "false",
      doc_references: "true",
      data_retrieval: "true",
      retrieval_protocol: "HTTPS",
    });

    // only the database lookup; no AI call, no save
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(DB_URL);
  });

  it("url-encodes the metadata id when looking up the database", async () => {
    fetch
      .mockResolvedValueOnce(dbRes({ status: 404, ok: false })) // GET record
      .mockResolvedValueOnce(aiRes({ content: aiContent(aiJson) })) // AI
      .mockResolvedValueOnce(dbRes()); // save

    await evaluateAIQuality({ ...md, id: "plain-id" });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://127.0.0.1:3005/records/plain-id"
    );
  });

  it("calls the AI and saves a new record when the database lookup 404s", async () => {
    fetch
      .mockResolvedValueOnce(dbRes({ status: 404, ok: false })) // GET record
      .mockResolvedValueOnce(aiRes({ content: aiContent(aiJson) })) // AI call
      .mockResolvedValueOnce(dbRes()); // POST /records

    const result = await evaluateAIQuality(md);

    expect(result).toEqual(aiJson);

    expect(fetch).toHaveBeenCalledTimes(3);

    const [aiUrl, aiOptions] = fetch.mock.calls[1];
    expect(aiUrl).toContain("chat/completions");
    const aiBody = JSON.parse(aiOptions.body);
    expect(aiBody.messages[0].content).toContain(md.short_description);
    expect(aiBody.messages[0].content).toContain(md.documentation);

    const [saveUrl, saveOptions] = fetch.mock.calls[2];
    expect(saveUrl).toBe("http://127.0.0.1:3005/records");
    expect(saveOptions.method).toBe("POST");
    const saved = JSON.parse(saveOptions.body);
    expect(saved.id_metadata).toBe(md.id);
    expect(saved.ai_result_short_description).toBe("Good");
    expect(saved.short_description).toBe(md.short_description);
  });

  it("updates the existing record (PUT) when the db row does not match the metadata", async () => {
    fetch
      .mockResolvedValueOnce(
        dbRes({ json: { ...cachedRecord, short_description: "outdated" } })
      )
      .mockResolvedValueOnce(aiRes({ content: aiContent(aiJson) }))
      .mockResolvedValueOnce(dbRes());

    await evaluateAIQuality(md);

    const [putUrl, putOptions] = fetch.mock.calls[2];
    expect(putUrl).toBe(DB_URL);
    expect(putOptions.method).toBe("PUT");
    const updated = JSON.parse(putOptions.body);
    expect(updated.ai_result_documentation).toBe("Good");
  });

  it("re-evaluates with the AI when reAssess is true, even if a cached result exists", async () => {
    fetch
      .mockResolvedValueOnce(dbRes({ json: cachedRecord })) // GET record (match)
      .mockResolvedValueOnce(aiRes({ content: aiContent(aiJson) })) // AI call
      .mockResolvedValueOnce(dbRes());

    const result = await evaluateAIQuality(md, true);

    expect(result).toEqual(aiJson);

    // GET, AI call, then PUT — cached result ignored
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls[1][0]).toContain("chat/completions");
    expect(fetch.mock.calls[2][1].method).toBe("PUT");
  });

  it("returns nulls when the AI endpoint rejects the request (401/429)", async () => {
    fetch
      .mockResolvedValueOnce(dbRes({ status: 404, ok: false }))
      .mockResolvedValueOnce(aiRes({ status: 401, ok: false }));

    await expect(evaluateAIQuality(md)).resolves.toEqual({
      short_description: null,
      documentation: null,
    });

    // nothing saved
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("returns nulls when the AI response has no content", async () => {
    fetch
      .mockResolvedValueOnce(dbRes({ status: 404, ok: false }))
      .mockResolvedValueOnce(aiRes({ content: undefined }));

    await expect(evaluateAIQuality(md)).resolves.toEqual({
      short_description: null,
      documentation: null,
    });
  });

  it("parses fenced ```json AI responses", async () => {
    fetch
      .mockResolvedValueOnce(dbRes({ status: 404, ok: false }))
      .mockResolvedValueOnce(aiRes({ content: aiContent(aiJson) }))
      .mockResolvedValueOnce(dbRes());

    await expect(evaluateAIQuality(md)).resolves.toEqual(aiJson);
  });

  it("parses plain (non-fenced) JSON AI responses", async () => {
    fetch
      .mockResolvedValueOnce(dbRes({ status: 404, ok: false }))
      .mockResolvedValueOnce(
        aiRes({ content: JSON.stringify(aiJson) })
      )
      .mockResolvedValueOnce(dbRes());

    await expect(evaluateAIQuality(md)).resolves.toEqual(aiJson);
  });

  it("returns nulls when the AI response is not valid JSON", async () => {
    fetch
      .mockResolvedValueOnce(dbRes({ status: 404, ok: false }))
      .mockResolvedValueOnce(
        aiRes({ content: "not json at all" })
      );

    await expect(evaluateAIQuality(md)).resolves.toEqual({
      short_description: null,
      documentation: null,
    });
  });

  it("returns nulls when the database is unreachable", async () => {
    fetch.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(evaluateAIQuality(md)).resolves.toEqual({
      short_description: null,
      documentation: null,
    });
  });
});

describe("hasCachedAiResult", () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  it("returns true when a matching record with an AI result exists", async () => {
    fetch.mockResolvedValue(dbRes({ json: cachedRecord }));

    await expect(hasCachedAiResult(md)).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledWith(DB_URL);
  });

  it("returns false when the stored content does not match the metadata", async () => {
    fetch.mockResolvedValue(
      dbRes({
        json: { ...cachedRecord, documentation: "changed docs" },
      })
    );

    await expect(hasCachedAiResult(md)).resolves.toBe(false);
  });

  it("returns false when the record has no stored AI result", async () => {
    fetch.mockResolvedValue(
      dbRes({
        json: { ...cachedRecord, ai_result_short_description: null },
      })
    );

    await expect(hasCachedAiResult(md)).resolves.toBe(false);
  });

  it("returns false when the record does not exist (404)", async () => {
    fetch.mockResolvedValue(dbRes({ status: 404, ok: false }));

    await expect(hasCachedAiResult(md)).resolves.toBe(false);
  });

  it("returns false when the database is unreachable", async () => {
    fetch.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(hasCachedAiResult(md)).resolves.toBe(false);
  });
});
