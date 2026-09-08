import { describe, it, expect } from "vitest";
import { replaceTemplate } from "./replaceTemplate.js";

describe("replaceTemplate", () => {
  it("replaces a single placeholder with its context value", () => {
    expect(replaceTemplate("Title has {count} words", { count: 4 })).toBe(
      "Title has 4 words"
    );
  });

  it("replaces every supported placeholder", () => {
    const msg =
      "{value} {count} {min} {aiResult1} {aiResult2} {validvalue} {urlvalue} {x_orcid} {x_people} {email} {auth} {protocol}";

    const context = {
      value: "doi:10.1/x",
      count: 12,
      min: 4,
      aiResult1: "Short description is Good",
      aiResult2: "Documentation is Fair",
      validvalue: "https://page",
      urlvalue: "https://download",
      x_orcid: 2,
      x_people: 3,
      email: "a@b.c",
      auth: "requires auth",
      protocol: "HTTPS",
    };

    expect(replaceTemplate(msg, context)).toBe(
      "doi:10.1/x 12 4 Short description is Good Documentation is Fair https://page https://download 2 3 a@b.c requires auth HTTPS"
    );
  });

  it("replaces missing context placeholders with an empty string", () => {
    expect(replaceTemplate("url {urlvalue} end", {})).toBe("url  end");
  });

  it("uses an empty context object by default", () => {
    expect(replaceTemplate("{count}/{min}")).toBe("/");
  });

  it("leaves messages without placeholders unchanged", () => {
    expect(replaceTemplate("A publication date is present.", { count: 9 })).toBe(
      "A publication date is present."
    );
  });

  it("inserts numeric context values", () => {
    expect(replaceTemplate("{x_orcid}/{x_people}", { x_orcid: 1, x_people: 4 })).toBe(
      "1/4"
    );
  });

  it("does not replace unknown placeholders", () => {
    expect(replaceTemplate("{unknown} {count}", { count: 1 })).toBe(
      "{unknown} 1"
    );
  });

  it("handles an empty message", () => {
    expect(replaceTemplate("", { count: 1 })).toBe("");
  });
});
