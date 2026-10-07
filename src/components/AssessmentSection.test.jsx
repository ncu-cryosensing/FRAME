// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import AssessmentSection from "./AssessmentSection";

afterEach(cleanup);

describe("AssessmentSection", () => {
  it("renders the principle title and completion percentage", () => {
    render(<AssessmentSection title="Findable" value={75} />);

    expect(screen.getByText("Findable")).toBeDefined();
    expect(screen.getByText(/75% complete/)).toBeDefined();
  });

  it("sets the progress bar width to the given value", () => {
    const { container } = render(
      <AssessmentSection title="Accessible" value={40} />
    );

    const bars = container.querySelectorAll("div[style]");
    const progressBar = [...bars].find((el) => el.style.width === "40%");
    expect(progressBar).toBeDefined();
    expect(progressBar.style.backgroundColor).toBe("rgb(76, 175, 80)");
    expect(progressBar.style.height).toBe("100%");
  });

  it("renders 0% for a score of zero", () => {
    const { container } = render(
      <AssessmentSection title="Interoperable" value={0} />
    );

    const progressBar = [...container.querySelectorAll("div[style]")].find(
      (el) => el.style.width === "0%"
    );
    expect(progressBar).toBeDefined();
  });

  it("renders 100% for a full score", () => {
    const { container } = render(
      <AssessmentSection title="Reusable" value={100} />
    );

    const progressBar = [...container.querySelectorAll("div[style]")].find(
      (el) => el.style.width === "100%"
    );
    expect(progressBar).toBeDefined();
  });
});
