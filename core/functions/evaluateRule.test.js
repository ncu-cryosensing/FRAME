import { describe, it, expect } from "vitest";
import { evaluateRule } from "./evaluateRule.js";

const baseAi = {
  short_description: "Good",
  documentation: "Good",
  index_page: "true",
  doc_language: "true",
  doc_references: "true",
  data_retrieval: "false",
  retrieval_protocol: "HTTPS",
};

describe("evaluateRule", () => {
  describe("type: exists", () => {
    const rule = { field: "publicationDate", type: "exists" };

    it("passes when the value is present", async () => {
      const { condition, context } = await evaluateRule(
        { publicationDate: "2024-01-01" },
        rule,
        baseAi,
        { validUrl: true, UrlPage: "" },
        {}
      );

      expect(condition).toBe(true);
      expect(context.value).toBe("2024-01-01");
    });

   it("fails for empty string, null and undefined values", async () => {
  for (const empty of ["", null, undefined]) {
    const { condition } = await evaluateRule(
      { publicationDate: empty },
      rule,
      baseAi,
      { validUrl: true, UrlPage: "" },
      {}
    );

    expect(condition).toBe(false);
  }
});

    it("builds the protocol and authorization context", async () => {
      const { context } = await evaluateRule(
        { publicationDate: "2024-01-01" },
        rule,
        baseAi,
        {},
        {}
      );

      expect(context.protocol).toBe("Dataset retrieval protocol: HTTPS");
      expect(context.auth).toBe(
        "Dataset access does not require authorization."
      );
    });

    it("flags authorization when the AI reports data_retrieval is true", async () => {
      const { context } = await evaluateRule(
        { publicationDate: "2024" },
        rule,
        { ...baseAi, data_retrieval: "true" },
        {},
        {}
      );

      expect(context.auth).toBe("Dataset access requires authorization.");
    });

    it("carries the corresponding author email into the context", async () => {
      const { context } = await evaluateRule(
        {
          publicationDate: "2024",
          corresponding_author: "me@example.org",
        },
        rule,
        baseAi,
        {},
        {}
      );

      expect(context.email).toBe("me@example.org");
    });
  });

  describe("type: wordCount", () => {
    const rule = { field: "title", type: "wordCount", min: 4 };

    it("passes when the word count meets the minimum", async () => {
      const { condition, context } = await evaluateRule(
        { title: "one two three four" },
        rule,
        baseAi,
        {},
        {}
      );

      expect(condition).toBe(true);
      expect(context.count).toBe(4);
      expect(context.min).toBe(4);
    });

    it("fails just below the minimum boundary", async () => {
      const { condition } = await evaluateRule(
        { title: "one two three" },
        rule,
        baseAi,
        {},
        {}
      );
      expect(condition).toBe(false);
    });

    it("fails for missing values (0 words)", async () => {
      const { condition, context } = await evaluateRule(
        {},
        rule,
        baseAi,
        {},
        {}
      );
      expect(condition).toBe(false);
      expect(context.count).toBe(0);
    });

    it("passes when min is 0 even for empty text", async () => {
      const { condition } = await evaluateRule(
        { title: "" },
        { field: "title", type: "wordCount", min: 0 },
        baseAi,
        {},
        {}
      );
      expect(condition).toBe(true);
    });

    it("collapses extra whitespace when counting", async () => {
      const { context } = await evaluateRule(
        { title: "  a   b \n\t c  d " },
        rule,
        baseAi,
        {},
        {}
      );
      expect(context.count).toBe(4);
    });
  });

  describe("type: arrayNotEmpty", () => {
    const rule = { field: "authors", type: "arrayNotEmpty" };

    it("fails when the value is not an array", async () => {
      const { condition } = await evaluateRule(
        { authors: "not an array" },
        rule,
        baseAi,
        {},
        {}
      );
      expect(condition).toBe(false);
    });
  });

  describe("type: valid", () => {
    const rule = { field: "url_page", type: "valid" };

    it("passes and exposes the landing page url", async () => {
      const { condition, context } = await evaluateRule(
        { url_page: "https://x" },
        rule,
        baseAi,
        { validUrl: true, UrlPage: "https://landing" },
        {}
      );

      expect(condition).toBe(true);
      expect(context.validvalue).toBe("https://landing");
    });

    it("fails when the landing page is invalid", async () => {
      const { condition, context } = await evaluateRule(
        { url_page: "https://x" },
        rule,
        baseAi,
        { validUrl: false, UrlPage: "https://landing" },
        {}
      );

      expect(condition).toBe(false);
      expect(context.validvalue).toBe("https://landing");
    });
  });

  describe("type: validdownload", () => {
    const rule = { field: "url_download", type: "valid" };

    it("passes and exposes the download url", async () => {
      const { condition, context } = await evaluateRule(
        { url_download: "https://d" },
        rule,
        baseAi,
        {},
        { validUrl: true, url: "https://download" }
      );

      expect(condition).toBe(true);
      expect(context.urlvalue).toBe("https://download");
    });

    it("fails when the download url is invalid", async () => {
      const { condition } = await evaluateRule(
        { url_download: "https://d" },
        rule,
        baseAi,
        {},
        { validUrl: false, url: "https://download" }
      );
      expect(condition).toBe(false);
    });

    it("fails when no download validation result is provided", async () => {
      const { condition } = await evaluateRule(
        { url_download: "https://d" },
        rule,
        baseAi,
        {}
      );
      // undefined.validUrl -> condition stays undefined (falsy)
      expect(condition).toBeFalsy();
    });
  });

  describe("type: aiQuality1 (short description)", () => {
    const rule = { field: "short_description", type: "aiQuality1" };

    it("fails when the field is not present", async () => {
      const { condition, context } = await evaluateRule(
        {},
        rule,
        baseAi,
        {},
        {}
      );

      expect(condition).toBe(false);
      expect(context.aiResult1).toBe("Short description is not present");
    });

    it("fails when the AI could not assess the field", async () => {
      const { condition, context } = await evaluateRule(
        { short_description: "some text" },
        rule,
        { ...baseAi, short_description: null },
        {},
        {}
      );

      expect(condition).toBe(false);
      expect(context.aiResult1).toBe("AI failed to assess Short Description");
    });

    it("passes when the AI rating is Good", async () => {
      const { condition, context } = await evaluateRule(
        { short_description: "some text" },
        rule,
        baseAi,
        {},
        {}
      );

      expect(condition).toBe(true);
      expect(context.aiResult1).toBe(
        "Readability and informativeness for Short Description is Good"
      );
    });

    it("fails when the AI rating is Poor", async () => {
      const { condition, context } = await evaluateRule(
        { short_description: "some text" },
        rule,
        { ...baseAi, short_description: "Poor" },
        {},
        {}
      );

      expect(condition).toBe(false);
      expect(context.aiResult1).toBe(
        "Readability and informativeness for Short Description is Poor"
      );
    });
  });

  describe("type: aiQuality2 (documentation)", () => {
    const rule = { field: "documentation", type: "aiQuality2" };

    it("fails when documentation is not present", async () => {
      const { condition, context } = await evaluateRule(
        {},
        rule,
        baseAi,
        {},
        {}
      );

      expect(condition).toBe(false);
      expect(context.aiResult2).toBe("Documentation is not present");
    });

    it("fails when the AI could not assess documentation", async () => {
      const { condition, context } = await evaluateRule(
        { documentation: "docs" },
        rule,
        { ...baseAi, documentation: null },
        {},
        {}
      );

      expect(condition).toBe(false);
      expect(context.aiResult2).toBe("AI failed to assess Documentation");
    });

    it("passes when the AI rating is not Poor", async () => {
      const { condition, context } = await evaluateRule(
        { documentation: "docs" },
        rule,
        { ...baseAi, documentation: "Fair" },
        {},
        {}
      );

      expect(condition).toBe(true);
      expect(context.aiResult2).toBe(
        "Readability and informativeness for Documentation is Fair"
      );
    });
  });

  describe("type: aiQuality3", () => {
    const rule = { field: "index_page", type: "aiQuality3" };

    it("passes when the AI flag is the string 'true'", async () => {
      const { condition } = await evaluateRule(
        { url_page: "https://x" },
        rule,
        baseAi,
        {},
        {}
      );
      expect(condition).toBe(true);
    });

    it("is case-insensitive and trims whitespace", async () => {
      const { condition } = await evaluateRule(
        { url_page: "https://x" },
        rule,
        { ...baseAi, index_page: "  TRUE  " },
        {},
        {}
      );
      expect(condition).toBe(true);
    });

    it("fails when the AI flag is 'false'", async () => {
      const { condition } = await evaluateRule(
        { url_page: "https://x" },
        rule,
        { ...baseAi, index_page: "false" },
        {},
        {}
      );
      expect(condition).toBe(false);
    });

    it("fails when the AI flag is null", async () => {
      const { condition } = await evaluateRule(
        { url_page: "https://x" },
        rule,
        { ...baseAi, index_page: null },
        {},
        {}
      );
      expect(condition).toBe(false);
    });

    it("fails when the AI flag is missing from the AI result", async () => {
      const { condition } = await evaluateRule(
        { url_page: "https://x" },
        { field: "does_not_exist", type: "aiQuality3" },
        baseAi,
        {},
        {}
      );
      expect(condition).toBe(false);
    });
  });

  it("returns the raw metadata value in the context", async () => {
    const { context } = await evaluateRule(
      { publicationDate: "2019-05-01" },
      { field: "publicationDate", type: "exists" },
      baseAi,
      {},
      {}
    );
    expect(context.value).toBe("2019-05-01");
  });

  it("returns condition false for unknown rule types", async () => {
    const { condition } = await evaluateRule(
      { title: "x" },
      { field: "title", type: "somethingElse" },
      baseAi,
      {},
      {}
    );
    expect(condition).toBe(false);
  });
});
