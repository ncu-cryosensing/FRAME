import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("node-fetch", () => ({ default: vi.fn() }));

import fetch from "node-fetch";
import { isValidUrl } from "./isValidUrl.js";

const htmlRes = (html, over = {}) => ({
  ok: over.ok ?? true,
  status: over.status ?? 200,
  headers: { get: () => null },
  json: async () => over.json,
  text: async () => html,
});

const page = (titleMarkup) => `
  <html>
    <head>${titleMarkup}</head>
    <body></body>
  </html>
`;

describe("isValidUrl", () => {
  beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
    fetch.mockReset();
  });

  it("fetches the landing page with GET and custom headers", async () => {
    fetch.mockResolvedValue(
      htmlRes(page('<meta property="og:title" content="My Dataset Title">'))
    );

    await isValidUrl("https://example.org/dataset", "My Dataset Title");

    expect(fetch).toHaveBeenCalledWith("https://example.org/dataset", {
      method: "GET",
      redirect: "follow",
      headers: {
        "Accept": "text/html",
        "User-Agent": "TaiPI-Data-Repository/1.0",
      },
    });
  });

  it("is valid when the og:title matches the dataset title", async () => {
    fetch.mockResolvedValue(
      htmlRes(page('<meta property="og:title" content="My Dataset Title">'))
    );

    await expect(
      isValidUrl("https://example.org/dataset", "My Dataset Title")
    ).resolves.toEqual({
      validUrl: true,
      UrlPage: "https://example.org/dataset",
    });
  });

  it("normalizes case and punctuation before comparing titles", async () => {
    fetch.mockResolvedValue(
      htmlRes(page('<meta property="og:title" content="My-Dataset: TITLE!">'))
    );

    await expect(
      isValidUrl("https://example.org/dataset", "my dataset title")
    ).resolves.toEqual({
      validUrl: true,
      UrlPage: "https://example.org/dataset",
    });
  });

  it("is invalid when the page title does not contain the dataset title", async () => {
    fetch.mockResolvedValue(
      htmlRes(page('<meta property="og:title" content="Something Else">'))
    );

    await expect(
      isValidUrl("https://example.org/dataset", "My Dataset Title")
    ).resolves.toEqual({
      validUrl: false,
      UrlPage: "https://example.org/dataset",
    });
  });

  it("falls back to the h1 element when og:title is missing", async () => {
    fetch.mockResolvedValue(
      htmlRes(page("<h1>Fallback H1 Title</h1>"))
    );

    await expect(
      isValidUrl("https://example.org/dataset", "Fallback H1 Title")
    ).resolves.toEqual({
      validUrl: true,
      UrlPage: "https://example.org/dataset",
    });
  });

  it("falls back to the title element when og:title and h1 are missing", async () => {
    fetch.mockResolvedValue(
      htmlRes(page("<title>Document Title Here</title>"))
    );

    await expect(
      isValidUrl("https://example.org/dataset", "Document Title Here")
    ).resolves.toEqual({
      validUrl: true,
      UrlPage: "https://example.org/dataset",
    });
  });

  it("is invalid when no page title can be extracted", async () => {
    fetch.mockResolvedValue(htmlRes(page("<!-- nothing useful -->")));

    // normalize(null) throws internally, which is caught and reported as invalid
    await expect(
      isValidUrl("https://example.org/dataset", "My Dataset Title")
    ).resolves.toEqual({
      validUrl: false,
      UrlPage: "https://example.org/dataset",
    });
  });

  it("is invalid for a non-ok response", async () => {
    fetch.mockResolvedValue(htmlRes("", { ok: false, status: 500 }));

    await expect(
      isValidUrl("https://example.org/dataset", "My Dataset Title")
    ).resolves.toEqual({
      validUrl: false,
      UrlPage: "https://example.org/dataset",
    });
  });

  it("is invalid when the request throws", async () => {
    fetch.mockRejectedValue(new Error("getaddrinfo ENOTFOUND"));

    await expect(
      isValidUrl("https://no-such-host.invalid", "My Dataset Title")
    ).resolves.toEqual({
      validUrl: false,
      UrlPage: "https://no-such-host.invalid",
    });
  });

  it("rewrites arcticdata object urls to their catalog view url", async () => {
    fetch.mockResolvedValue(
      htmlRes(page('<meta property="og:title" content="Arctic Data">'))
    );

    const objectUrl =
      "https://arcticdata.io/metacat/d1/mn/v2/object/doi%3A10.18739%2FA2RX93F75";

    await expect(isValidUrl(objectUrl, "Arctic Data")).resolves.toEqual({
      validUrl: true,
      UrlPage: "https://arcticdata.io/catalog/view/doi:10.18739/A2RX93F75",
    });
  });

  it("reads dataverse api responses and rewrites the landing page url", async () => {
    fetch.mockResolvedValue(
      htmlRes("", {
        json: {
          data: {
            latestVersion: {
              metadataBlocks: {
                citation: {
                  fields: [
                    { typeName: "title", value: "Dataverse Study" },
                  ],
                },
              },
            },
          },
        },
      })
    );

    const apiUrl =
      "https://dataverse.harvard.edu/api/datasets/:persistentId?persistentId=doi:10.7910/DVN/ES8GTH";

    await expect(isValidUrl(apiUrl, "Dataverse Study")).resolves.toEqual({
      validUrl: true,
      UrlPage:
        "https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/ES8GTH",
    });
  });

  it("is invalid for a dataverse response whose title does not match", async () => {
    fetch.mockResolvedValue(
      htmlRes("", {
        json: {
          data: {
            latestVersion: {
              metadataBlocks: {
                citation: {
                  fields: [
                    { typeName: "title", value: "Different Title" },
                  ],
                },
              },
            },
          },
        },
      })
    );

    const apiUrl =
      "https://dataverse.harvard.edu/api/datasets/:persistentId?persistentId=doi:10.7910/DVN/XXXXX";

    await expect(isValidUrl(apiUrl, "Dataverse Study")).resolves.toEqual({
      validUrl: false,
      UrlPage:
        "https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/XXXXX",
    });
  });

  it("handles a dataverse response without a title field (no title found)", async () => {
    fetch.mockResolvedValue(
      htmlRes("", {
        json: {
          data: {
            latestVersion: {
              metadataBlocks: { citation: { fields: [] } },
            },
          },
        },
      })
    );

    const apiUrl =
      "https://dataverse.harvard.edu/api/datasets/:persistentId?persistentId=doi:10.7910/DVN/YYYYY";

    await expect(isValidUrl(apiUrl, "Any Title")).resolves.toEqual({
      validUrl: false,
      UrlPage:
        "https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/YYYYY",
    });
  });
});
