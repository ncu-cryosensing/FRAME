import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("node-fetch", () => ({ default: vi.fn() }));

import fetch from "node-fetch";
import { isValidDownloadUrl } from "./isValidDownloadUrl.js";

const res = (over = {}) => ({
  ok: over.ok ?? true,
  status: over.status ?? 200,
  headers: {
    get: (name) => over.headers?.[name.toLowerCase()] ?? null,
  },
});

describe("isValidDownloadUrl", () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  it("issues a HEAD request that follows redirects", async () => {
    fetch.mockResolvedValue(
      res({ headers: { "content-type": "application/zip" } })
    );

    await isValidDownloadUrl("https://example.org/data.zip");

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("https://example.org/data.zip", {
      method: "GET",
      redirect: "follow",
    });
  });

  it("returns a valid result for a non-html resource", async () => {
    fetch.mockResolvedValue(
      res({
        headers: {
          "content-type": "application/zip",
          "content-length": "12345",
        },
      })
    );

    await expect(
      isValidDownloadUrl("https://example.org/data.zip")
    ).resolves.toEqual({ validUrl: true, url: "https://example.org/data.zip" });
  });

  it("still validates when the content-type header is missing", async () => {
    fetch.mockResolvedValue(
      res({ headers: { "content-length": "10" } })
    );

    await expect(
      isValidDownloadUrl("https://example.org/file")
    ).resolves.toEqual({ validUrl: true, url: "https://example.org/file" });
  });

  it("returns false for a non-ok response", async () => {
    fetch.mockResolvedValue(res({ ok: false, status: 404 }));

    await expect(
      isValidDownloadUrl("https://example.org/missing.zip")
    ).resolves.toBe(false);
  });

  it("returns false when the response is an html page", async () => {
    fetch.mockResolvedValue(
      res({ headers: { "content-type": "text/html; charset=utf-8" } })
    );

    await expect(
      isValidDownloadUrl("https://example.org/landing")
    ).resolves.toBe(false);
  });

  it("returns false when the content length is zero", async () => {
    fetch.mockResolvedValue(
      res({
        headers: { "content-type": "application/zip", "content-length": "0" },
      })
    );

    await expect(
      isValidDownloadUrl("https://example.org/empty.zip")
    ).resolves.toBe(false);
  });

  it("returns false for a negative content length", async () => {
    fetch.mockResolvedValue(
      res({
        headers: { "content-type": "application/zip", "content-length": "-1" },
      })
    );

    await expect(
      isValidDownloadUrl("https://example.org/bad.zip")
    ).resolves.toBe(false);
  });

  it("still validates when the content-length header is absent", async () => {
    fetch.mockResolvedValue(
      res({ headers: { "content-type": "application/octet-stream" } })
    );

    await expect(
      isValidDownloadUrl("https://example.org/stream")
    ).resolves.toEqual({ validUrl: true, url: "https://example.org/stream" });
  });

  it("returns false when the request throws (unreachable host)", async () => {
    fetch.mockRejectedValue(new Error("getaddrinfo ENOTFOUND"));

    await expect(
      isValidDownloadUrl("https://no-such-host.invalid/file")
    ).resolves.toBe(false);
  });
});
