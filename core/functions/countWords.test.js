import { describe, it, expect } from "vitest";
import { countWords } from "./countWords.js";

describe("countWords", () => {
  it("counts words in a plain sentence", () => {
    expect(countWords("The quick brown fox")).toBe(4);
  });

  it("collapses multiple whitespace characters", () => {
    expect(countWords("  hello   world \n\t foo  ")).toBe(3);
  });

  it("returns 0 for an empty string", () => {
    expect(countWords("")).toBe(0);
  });

  it("returns 0 for null or undefined input", () => {
    expect(countWords(null)).toBe(0);
    expect(countWords(undefined)).toBe(0);
  });
});
