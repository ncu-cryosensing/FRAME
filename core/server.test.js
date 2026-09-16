import { describe, it, expect, beforeAll, vi } from "vitest";

// server.js reads "./rules.json" relative to the process cwd (the npm script
// runs it from core/) and listens on process.env.PORT. Reproduce both here
// so the real server module can be exercised without touching production ports.
process.chdir("core");
process.env.PORT = "3997";

vi.mock("node-fetch", () => ({ default: vi.fn() }));

import fetchMock from "node-fetch";

const BASE = "http://127.0.0.1:3997";

const dbRes = (over = {}) => ({
  ok: over.ok ?? true,
  status: over.status ?? 200,
  headers: { get: () => null },
  json: async () => over.json,
});

const aiRes = (content) => ({
  ok: true,
  status: 200,
  headers: { get: () => null },
  json: async () => ({
    choices: [
      {
        message: {
          content: "```json\n" + JSON.stringify(content) + "\n```",
        },
      },
    ],
  }),
});

const htmlRes = (html) => ({
  ok: true,
  status: 200,
  headers: { get: () => null },
  text: async () => html,
  json: async () => ({}),
});

const downloadRes = (headers) => ({
  ok: true,
  status: 200,
  headers: {
    get: (name) => headers[name.toLowerCase()] ?? null,
  },
});

const aiJson = {
  short_description: "Good",
  documentation: "Good",
  index_page: "true",
  doc_language: "true",
  doc_references: "true",
  data_retrieval: "false",
  retrieval_protocol: "HTTPS",
};

const goodMd = {
  id: "test-id",
  title: "A Well Described Arctic Dataset",
  authors: [{ name: "Jane Doe" }, { name: "John Roe" }],
  publicationDate: "2024-06-01",
  doi: "doi:10.18739/TEST",
  url_page: "https://example.org/view/test",
  url_download: "https://example.org/data.zip",
  cloud_environment: "https://taipidata.ncu.edu.tw/taipihub/hub/spawn?dataset=11309301",
  url_api: "https://example.org/api",
  repository_name: "Example Repository",
  metadataIdentifier: "doi:10.18739/TEST",
  resourceType: "dataset",
  spatialExtent: "northlimit=80; southlimit=70",

  short_description:
    "This dataset contains observations of arctic sea ice thickness collected over several field campaigns in northern Greenland during recent summers.",

  documentation:
    "Data were collected using an airborne altimeter and processed to derive ice thickness. " +
    "The processing pipeline includes calibration steps and quality filtering to remove unreliable measurements. " +
    "All scripts used to produce the results are archived together with the derived data products. " +
    "Field campaigns were conducted during the summer seasons over a period of several years. " +
    "Each flight collected along-track observations that were later averaged to produce gridded thickness products. " +
    "Uncertainty estimates accompany every derived value so that downstream users can propagate errors into their own analyses. " +
    "Documentation of the processing code, including the version numbers of every software dependency, is stored in the same archive as the data itself.",

  corresponding_author: "contact@example.org",
  license: "cc_by",
  award: "NSF-12345",
  fundername: "NSF"
};

async function post(path, body) {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function get(path) {
  return fetch(`${BASE}${path}`);
}

describe("FRAME assessment API (core server)", () => {
  beforeAll(async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
    await import("./server.js");

    // Wait for Express to accept connections.
    for (let i = 0; i < 50; i++) {
      try {
        await post("/api/ai-cache-check", {});
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    throw new Error("assessment server did not start");
  });

  it("rejects an empty body on /api/assess-dev", async () => {
    const res = await post("/api/assess-dev", {});

    expect(res.status).toBe(400);

    expect(await res.json()).toEqual({
      success: false,
      error: "JSON body is required",
    });
  });

  it("rejects an empty body on /api/ai-cache-check", async () => {
    const res = await post("/api/ai-cache-check", {});

    expect(res.status).toBe(400);
  });

  it("reports cached=true when a matching AI result exists in the database", async () => {
    fetchMock.mockReset().mockResolvedValueOnce(
      dbRes({
        json: {
          short_description: "a",
          documentation: "b",
          ai_result_short_description: "Good",
        },
      })
    );

    const res = await post("/api/ai-cache-check", {
      id: "123",
      short_description: "a",
      documentation: "b",
    });

    expect(res.status).toBe(200);

    expect(await res.json()).toEqual({
      cached: true,
    });
  });

  it("reports cached=false when no AI result exists in the database", async () => {
    fetchMock
      .mockReset()
      .mockResolvedValueOnce(
        dbRes({
          status: 404,
          ok: false,
        })
      );

    const res = await post("/api/ai-cache-check", {
      id: "123",
      short_description: "a",
      documentation: "b",
    });

    expect(res.status).toBe(200);

    expect(await res.json()).toEqual({
      cached: false,
    });
  });

  it("assesses metadata successfully via /api/assess-dev", async () => {
    fetchMock
      .mockReset()
      // 1. GET cached record
      .mockResolvedValueOnce(
        dbRes({
          status: 404,
          ok: false,
        })
      )
      // 2. AI chat completion
      .mockResolvedValueOnce(aiRes(aiJson))
      // 3. Save assessment to database
      .mockResolvedValueOnce(dbRes())
      // 4. Landing page validation
      .mockResolvedValueOnce(
        htmlRes(
          '<meta property="og:title" content="A Well Described Arctic Dataset">'
        )
      )
      // 5. Download URL validation
      .mockResolvedValueOnce(
        downloadRes({
          "content-type": "application/zip",
          "content-length": "10",
        })
      );

    const res = await post("/api/assess-dev", goodMd);

    expect(res.status).toBe(200);

    const { assessment } = await res.json();

    expect(assessment.totalChecks).toBe(21);
    expect(assessment.failed).toBe(2);
    expect(assessment.passed).toBe(19);
    expect(assessment.warnings).toBe(0);
    expect(assessment.informational).toBe(7);

    // AI was called because there was no cache hit.
    expect(fetchMock.mock.calls[1][0]).toContain("chat/completions");

    // Assessment was saved to the database.
    const [saveUrl, saveOptions] = fetchMock.mock.calls[2];

    expect(saveUrl).toBe("http://127.0.0.1:3005/records");
    expect(saveOptions.method).toBe("POST");
  });

 
  it("honours reassess=true by calling the AI even when a cached result exists", async () => {
    fetchMock
      .mockReset()
      // 1. Existing cached record
      .mockResolvedValueOnce(
        dbRes({
          json: {
            short_description: goodMd.short_description,
            documentation: goodMd.documentation,
            ai_result_short_description: "Good",
          },
        })
      )
      // 2. AI chat completion because reassess=true
      .mockResolvedValueOnce(aiRes(aiJson))
      // 3. Update assessment in database
      .mockResolvedValueOnce(dbRes())
      // 4. Landing page validation
      .mockResolvedValueOnce(
        htmlRes(
          '<meta property="og:title" content="A Well Described Arctic Dataset">'
        )
      )
      // 5. Download URL validation
      .mockResolvedValueOnce(
        downloadRes({
          "content-type": "application/zip",
          "content-length": "10",
        })
      );

    const res = await post("/api/assess-dev?reassess=true", goodMd);

    expect(res.status).toBe(200);

    const { assessment } = await res.json();

    expect(assessment.totalChecks).toBe(21);

    // GET record, AI (cache ignored), PUT, landing page, download.
    expect(fetchMock).toHaveBeenCalledTimes(6);

    expect(fetchMock.mock.calls[1][0]).toContain("chat/completions");

    expect(fetchMock.mock.calls[2][1].method).toBe("PUT");
  });

  it("serves the swagger documentation", async () => {
    const res = await fetch(`${BASE}/api/docs`);

    expect(res.status).toBe(200);
  });
});

describe("GET /api/assess and /api/check-url (core server)", () => {
  beforeAll(async () => {
    // server module was already imported and is listening
    await import("./server.js");
  });

  const upstreamMetaUrl = "https://example.org/meta.json";

  const get = (path) => fetch(`${BASE}${path}`);

  const jsonRes = (json, over = {}) => ({
    ok: over.ok ?? true,
    status: over.status ?? 200,
    headers: { get: (name) => over.headers?.[name] ?? "application/json" },
    json: async () => json,
    text: async () => JSON.stringify(json),
  });

  const xmlRes = (xml) => ({
    ok: true,
    status: 200,
    headers: { get: () => "text/xml" },
    text: async () => xml,
  });

  // queue: upstream metadata, GET record, AI, save, landing page, download
  const queueAssessPipeline = (upstream) => {
    fetchMock
      .mockReset()
      .mockResolvedValueOnce(upstream)
      .mockResolvedValueOnce(dbRes({ status: 404, ok: false })) // GET record
      .mockResolvedValueOnce(aiRes(aiJson)) // AI chat completion
      .mockResolvedValueOnce(dbRes()) // POST /records
      .mockResolvedValueOnce(
        htmlRes('<meta property="og:title" content="A Well Described Arctic Dataset">')
      )
      .mockResolvedValueOnce(
        downloadRes({ "content-type": "application/zip", "content-length": "10" })
      );
  };

  describe("/api/assess", () => {
    it("requires the url query parameter", async () => {
      const res = await get("/api/assess");

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        success: false,
        error: "url parameter required",
      });
    });

    it("returns 500 when the upstream metadata url is not reachable", async () => {
      fetchMock
        .mockReset()
        .mockResolvedValueOnce({ ok: false, status: 404, headers: { get: () => null } });

      const res = await get(`/api/assess?url=${encodeURIComponent(upstreamMetaUrl)}`);

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({
        success: false,
        error: "HTTP 404",
      });
    });

    it("assesses a plain JSON metadata document from a url", async () => {
      queueAssessPipeline(jsonRes(goodMd));

      const res = await get(`/api/assess?url=${encodeURIComponent(upstreamMetaUrl)}`);

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.assessment.totalChecks).toBe(21);
      expect(body.assessment.failed).toBe(2);
      expect(body.assessment.passed).toBe(19);
      expect(body.assessment.warnings).toBe(0);

      // the metadata was fetched from the upstream url (plain fetch, no options)
      expect(fetchMock.mock.calls[0][0]).toBe(upstreamMetaUrl);
    });

    it("converts and assesses a Zenodo record", async () => {
      queueAssessPipeline(
        jsonRes({
          id: 42,
          links: { self: "https://zenodo.org/api/records/42" },
          metadata: {
            title: "A Zenodo Test Dataset",
            description: "A short zenodo description.",
            publication_date: "2024-01-01",
            doi: "10.5281/zenodo.42",
            creators: [{ name: "Doe, Jane", affiliation: "Uni A" }],
            license: { id: "cc-by-4.0" },
          },
          files: [
            { links: { self: "https://zenodo.org/api/records/42/files/data.zip" } },
          ],
        })
      );

      const res = await get(`/api/assess?url=${encodeURIComponent(upstreamMetaUrl)}`);

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.assessment.totalChecks).toBe(21);

      // the metadata was fetched from the upstream url
      expect(fetchMock.mock.calls[0][0]).toBe(upstreamMetaUrl);

      // the Zenodo record was converted -> its id (42) is used for the db lookup
      expect(fetchMock.mock.calls[1][0]).toBe(
        "http://127.0.0.1:3005/records/42"
      );

      // and the AI result was saved under the converted id
      const saved = JSON.parse(fetchMock.mock.calls[3][1].body);
      expect(saved.id_metadata).toBe("42");
      expect(saved.short_description).toBe("A short zenodo description.");
    });

    it("parses and assesses an EML (arcticdata) XML document", async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <eml:eml>
          <dataset id="doi:10.18739/TESTEML">
            <title>An Arctic EML Test Dataset</title>
            <abstract><para>This EML test dataset contains enough descriptive text to pass the short description word count rule.</para></abstract>
            <pubDate>2024-06-01</pubDate>
            <creator>
              <individualName><givenName>Jane</givenName><surName>Doe</surName></individualName>
            </creator>
            <contact><electronicMailAddress>eml@arctic.org</electronicMailAddress></contact>
          </dataset>
        </eml:eml>`;

      queueAssessPipeline(xmlRes(xml));

      const res = await get(`/api/assess?url=${encodeURIComponent(upstreamMetaUrl)}`);

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.assessment.totalChecks).toBe(21);

      // the EML document was converted -> its @_id drives the db lookup
      expect(fetchMock.mock.calls[1][0]).toBe(
        "http://127.0.0.1:3005/records/doi%3A10.18739%2FTESTEML"
      );

      // and the AI result was saved under the converted id
      const saved = JSON.parse(fetchMock.mock.calls[3][1].body);
      expect(saved.id_metadata).toBe("doi:10.18739/TESTEML");
    });

    it("returns 500 when the metadata cannot be assessed (missing authors crash)", async () => {
      fetchMock
        .mockReset()
        .mockResolvedValueOnce(jsonRes({ title: "Broken metadata" })) // upstream
        .mockResolvedValueOnce(dbRes({ status: 404, ok: false })) // GET record
        .mockResolvedValueOnce(aiRes(aiJson)) // AI
        .mockResolvedValueOnce(dbRes()); // save

      const res = await get(`/api/assess?url=${encodeURIComponent(upstreamMetaUrl)}`);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      // the arrayNotEmpty rule reads value.length on the missing authors field
      expect(body.error).toContain("length");
    });
  });

  describe("/api/check-url", () => {
    it("requires both url and title query parameters", async () => {
      const res = await get("/api/check-url?url=https://example.org");

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        success: false,
        error: "url and title are required",
      });
    });

    it("reports validUrl=true when the page title matches the dataset title", async () => {
      fetchMock.mockReset().mockResolvedValueOnce(
        htmlRes('<meta property="og:title" content="My Dataset Title">')
      );

      const res = await get(
        `/api/check-url?url=${encodeURIComponent("https://example.org/dataset")}&title=${encodeURIComponent("My Dataset Title")}`
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        success: true,
        validUrl: true,
        UrlPage: "https://example.org/dataset",
      });
    });

    it("reports validUrl=false when the page title does not match", async () => {
      fetchMock.mockReset().mockResolvedValueOnce(
        htmlRes('<meta property="og:title" content="Something Else">')
      );

      const res = await get(
        `/api/check-url?url=${encodeURIComponent("https://example.org/dataset")}&title=${encodeURIComponent("My Dataset Title")}`
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        success: true,
        validUrl: false,
        UrlPage: "https://example.org/dataset",
      });
    });

    it("reports validUrl=false when the landing page returns an error status", async () => {
      fetchMock.mockReset().mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: { get: () => null },
      });

      const res = await get(
        `/api/check-url?url=${encodeURIComponent("https://example.org/broken")}&title=${encodeURIComponent("My Dataset Title")}`
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        success: true,
        validUrl: false,
        UrlPage: "https://example.org/broken",
      });
    });

    it("reports validUrl=false when the request fails instead of returning 500", async () => {
      fetchMock.mockReset().mockRejectedValue(new Error("getaddrinfo ENOTFOUND"));

      const res = await get(
        `/api/check-url?url=${encodeURIComponent("https://no-such-host.invalid")}&title=${encodeURIComponent("My Dataset Title")}`
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        success: true,
        validUrl: false,
        UrlPage: "https://no-such-host.invalid",
      });
    });
  });
});

