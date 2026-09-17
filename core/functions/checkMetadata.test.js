import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("./evaluateAIQuality.js", () => ({
  evaluateAIQuality: vi.fn(),
  hasCachedAiResult: vi.fn(),
}));

vi.mock("./isValidUrl.js", () => ({ isValidUrl: vi.fn() }));

vi.mock("./isValidDownloadUrl.js", () => ({
  isValidDownloadUrl: vi.fn(),
}));

import { evaluateAIQuality } from "./evaluateAIQuality.js";
import { isValidUrl } from "./isValidUrl.js";
import { isValidDownloadUrl } from "./isValidDownloadUrl.js";
import { checkMetadata } from "./checkMetadata.js";
import rules from "../rules.json";

const goodMd = {
  id: "test-id",
  title: "A Well Described Arctic Dataset",

  authors: [
    {
      name: "Jane Doe",
      orcid: "0000-0001-1111-1111",
      affiliation: "TEST",
    },
    {
      name: "John Roe",
      orcid: "0000-0002-2222-2222",
      affiliation: "TEST",
    },
  ],

  publicationDate: "2024-06-01",
  doi: "https://doi.org/10.30238/TEST",
  url_page: "https://example.org/view/test",
  url_download: "https://example.org/data.zip",
  cloud_environment:
    "https://taipidata.ncu.edu.tw/taipihub/hub/spawn?dataset=11309301",
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
  fundername: "NSF",
};

const aiQuality = {
  short_description: "Good",
  documentation: "Good",
  index_page: "true",
  doc_language: "true",
  doc_references: "true",
  data_retrieval: "false",
  retrieval_protocol: "HTTPS",
};

describe("checkMetadata", () => {
  beforeEach(() => {
    vi.mocked(evaluateAIQuality)
      .mockReset()
      .mockResolvedValue(aiQuality);

    vi.mocked(isValidUrl)
      .mockReset()
      .mockResolvedValue({
        validUrl: true,
        UrlPage: goodMd.url_page,
      });

    vi.mocked(isValidDownloadUrl)
      .mockReset()
      .mockResolvedValue({
        validUrl: true,
        url: goodMd.url_download,
      });
  });

  it("passes all required checks for fully populated metadata", async () => {
    const result = await checkMetadata(goodMd, rules);

    expect(result.totalChecks).toBe(rules.checks.length);

    expect(result.passed).toBe(rules.checks.length);
    expect(result.failed).toBe(0);
    expect(result.warnings).toBe(0);

    expect(result.informational).toBe(7);
  });


  it("accumulates per-principle totals according to the rules", async () => {
    const result = await checkMetadata(goodMd, rules);

    const expectedTotals = rules.checks.reduce((acc, rule) => {
      acc[rule.principle] = (acc[rule.principle] || 0) + 1;
      return acc;
    }, {});

    for (const [principle, count] of Object.entries(expectedTotals)) {
      expect(result.totalScores[principle]).toBe(count);
    }
  });

  it("passes the metadata to the AI quality evaluation", async () => {
    await checkMetadata(goodMd, rules);

    expect(evaluateAIQuality).toHaveBeenCalledWith(goodMd, false);
  });

  it("forwards the reAssess flag to the AI quality evaluation", async () => {
    await checkMetadata(goodMd, rules, true);

    expect(evaluateAIQuality).toHaveBeenCalledWith(goodMd, true);
  });

  it("fills template messages with real context values", async () => {
    const result = await checkMetadata(goodMd, rules);

    const titleCheck = result.passedChecks.find(
      (c) => c.message.includes("title contains 5 words")
    );

    expect(titleCheck).toBeDefined();

    const doiCheck = result.passedChecks.find(
      (c) => c.message.includes("https://doi.org/10.30238/TEST")
    );

    expect(doiCheck).toBeDefined();

    const downloadCheck = result.passedChecks.find(
      (c) =>
        c.message ===
        "A downloading url https://example.org/data.zip is accessible."
    );

    expect(downloadCheck).toBeDefined();
  });

  it("handles empty metadata without crashing", async () => {
    const result = await checkMetadata({}, rules);

    expect(result).toBeDefined();
    expect(result.totalChecks).toBe(rules.checks.length);
  });

  it("reports an informational entry when url_api is present", async () => {
    const result = await checkMetadata(goodMd, rules);

    const apiInfo = result.informationalCheck.find(
      (c) =>
        c.message ===
        "API endpoint is present at https://example.org/api"
    );

    expect(apiInfo).toBeDefined();
    expect(apiInfo.principle).toBe("Accessible");
    expect(apiInfo.level).toBe("INFO");
  });

  it("keeps counters consistent: passed + failed + warnings equals totalChecks", async () => {
    const result = await checkMetadata(goodMd, rules);

    expect(result.passed + result.failed + result.warnings).toBe(
      result.totalChecks
    );
  });
});