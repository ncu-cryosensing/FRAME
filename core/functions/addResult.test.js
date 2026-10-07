import { describe, it, expect } from "vitest";
import { addResult } from "./addResult.js";

const makeResult = () => ({
  totalChecks: 0,
  totalScores: { Findable: 0, Accessible: 0, Interoperable: 0, Reusable: 0 },
  passed: 0,
  warnings: 0,
  failed: 0,
  informational: 0,
  passedScores: { Findable: 0, Accessible: 0, Interoperable: 0, Reusable: 0 },
  passedChecks: [],
  warningChecks: [],
  failedChecks: [],
  informationalCheck: [],
});

describe("addResult", () => {
  it("records a passed check for a true condition", () => {
    const result = makeResult();

    addResult(result, true, "title ok", "title bad", "REQUIRED", "Findable");

    expect(result.totalChecks).toBe(1);
    expect(result.totalScores.Findable).toBe(1);
    expect(result.passed).toBe(1);
    expect(result.passedScores.Findable).toBe(1);
    expect(result.passedChecks).toEqual([
      { message: "title ok", level: "REQUIRED", principle: "Findable" },
    ]);
    expect(result.failed).toBe(0);
    expect(result.warnings).toBe(0);
    expect(result.failedChecks).toHaveLength(0);
    expect(result.warningChecks).toHaveLength(0);
  });

  it("records a failure for a false REQUIRED check", () => {
    const result = makeResult();

    addResult(result, false, "ok msg", "missing title", "REQUIRED", "Findable");

    expect(result.totalChecks).toBe(1);
    expect(result.totalScores.Findable).toBe(1);
    expect(result.passed).toBe(0);
    expect(result.passedScores.Findable).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.warnings).toBe(0);
    expect(result.failedChecks).toEqual([
      { message: "missing title", level: "REQUIRED", principle: "Findable" },
    ]);
    expect(result.warningChecks).toHaveLength(0);
  });

  it("records a warning for a false non-REQUIRED check", () => {
    const result = makeResult();

    addResult(result, false, "ok msg", "no award number", "OPTIONAL", "Reusable");

    expect(result.failed).toBe(0);
    expect(result.warnings).toBe(1);
    expect(result.warningChecks).toEqual([
      { message: "no award number", level: "OPTIONAL", principle: "Reusable" },
    ]);
    expect(result.failedChecks).toHaveLength(0);
  });

  it("does not increase passedScores when the check fails", () => {
    const result = makeResult();

    addResult(result, false, "ok", "bad", "REQUIRED", "Accessible");

    expect(result.totalScores.Accessible).toBe(1);
    expect(result.passedScores.Accessible).toBe(0);
  });

  it("accumulates across multiple checks and principles", () => {
    const result = makeResult();

    addResult(result, true, "a ok", "a bad", "REQUIRED", "Findable");
    addResult(result, false, "b ok", "b bad", "REQUIRED", "Findable");
    addResult(result, false, "c ok", "c warn", "OPTIONAL", "Reusable");
    addResult(result, true, "d ok", "d bad", "REQUIRED", "Reusable");

    expect(result.totalChecks).toBe(4);
    expect(result.totalScores.Findable).toBe(2);
    expect(result.totalScores.Reusable).toBe(2);
    expect(result.passed).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.warnings).toBe(1);
    expect(result.passedScores.Findable).toBe(1);
    expect(result.passedScores.Reusable).toBe(1);
    expect(result.passedChecks).toHaveLength(2);
    expect(result.failedChecks).toHaveLength(1);
    expect(result.warningChecks).toHaveLength(1);
  });

  it("stores the failure message (not the success message) on failure", () => {
    const result = makeResult();

    addResult(result, false, "success msg", "failure msg", "REQUIRED", "Findable");

    expect(result.failedChecks[0].message).toBe("failure msg");
  });

  it("treats any non-REQUIRED level as a warning on failure", () => {
    const result = makeResult();

    addResult(result, false, "ok", "warn", "RECOMMENDED", "Findable");

    expect(result.warnings).toBe(1);
    expect(result.failed).toBe(0);
  });
});
