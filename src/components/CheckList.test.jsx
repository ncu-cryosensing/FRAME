// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import CheckList from "./CheckList";

afterEach(cleanup);

const items = [
  {
    message: "The title contains 5 words.",
    level: "REQUIRED",
    principle: "Findable",
  },
  {
    message: "See https://example.org/data for details.",
    level: "INFO",
    principle: "Accessible",
  },
];

describe("CheckList", () => {
  it("renders the title with the number of items", () => {
    render(<CheckList title="Passed Checks" items={items} color="#4CAF50" />);

    expect(screen.getByText(/Passed Checks \(2\)/)).toBeDefined();
  });

  it("renders the level, principle and message of every check", () => {
    const { container } = render(
      <CheckList title="Passed Checks" items={items} color="#4CAF50" />
    );

    const text = container.textContent;
    expect(text).toContain("REQUIRED");
    expect(text).toContain("Findable");
    expect(text).toContain("The title contains 5 words.");
    expect(text).toContain("INFO");
    expect(text).toContain("Accessible");
  });

  it("turns URLs inside messages into clickable links", () => {
    render(<CheckList title="Passed Checks" items={items} color="#4CAF50" />);

    const link = screen.getByRole("link", {
      name: "https://example.org/data",
    });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("https://example.org/data");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("keeps the surrounding message text outside the link", () => {
    render(<CheckList title="Passed Checks" items={items} color="#4CAF50" />);

    expect(screen.getByText(/See /)).toBeDefined();
    expect(screen.getByText(/ for details\./)).toBeDefined();
  });

  it("applies the given color to the left border", () => {
    const { container } = render(
      <CheckList title="Failed Checks" items={[]} color="#F44336" />
    );

    const wrapper = container.firstElementChild;
    expect(wrapper.style.borderLeft).toBe("5px solid rgb(244, 67, 54)");
  });

  it("renders an empty list without items", () => {
    render(<CheckList title="Warnings" items={[]} color="#FFC107" />);

    expect(screen.getByText(/Warnings \(0\)/)).toBeDefined();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
