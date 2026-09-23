// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

vi.mock("react-chartjs-2", () => ({
  Pie: vi.fn(() => <div data-testid="mock-pie" />),
}));

import { Pie } from "react-chartjs-2";
import SummaryChart from "./SummaryChart";

beforeEach(() => {
  vi.mocked(Pie).mockClear();
});

afterEach(cleanup);

describe("SummaryChart", () => {
  it("passes the four result counters to the pie chart in order", () => {
    render(
      <SummaryChart
        passed={6}
        warnings={2}
        failed={3}
        information={4}
        total={15}
      />
    );

    expect(vi.mocked(Pie)).toHaveBeenCalledTimes(1);

    const props = vi.mocked(Pie).mock.calls[0][0];
    expect(props.data.labels).toEqual(["Passed", "Warnings", "Failed", "Info"]);
    expect(props.data.datasets[0].data).toEqual([6, 2, 3, 4]);
  });

  it("uses the standard FAIR result colors", () => {
    render(
      <SummaryChart passed={1} warnings={0} failed={0} information={0} total={1} />
    );

    const props = vi.mocked(Pie).mock.calls[0][0];
    expect(props.data.datasets[0].backgroundColor).toEqual([
      "rgba(76, 175, 80, 0.5)",
      "rgba(255, 193, 7, 0.5)",
      "rgba(244, 67, 54, 0.5)",
      "rgba(58, 135, 172, 0.5)",
    ]);
  });

  it("registers a center-text plugin that draws the total number of checks", () => {
    render(
      <SummaryChart passed={1} warnings={2} failed={3} information={4} total={10} />
    );

    const props = vi.mocked(Pie).mock.calls[0][0];
    const plugin = props.plugins.find((p) => p.id === "centerText");
    expect(plugin).toBeDefined();

    const fillText = vi.fn();
    const fakeChart = {
      width: 150,
      height: 150,
      ctx: {
        restore: vi.fn(),
        save: vi.fn(),
        fillText,
      },
    };

    plugin.beforeDraw(fakeChart);

    const [firstLine, secondLine] = fillText.mock.calls.map(
      (call) => call[0]
    );
    expect(firstLine).toBe("10");
    expect(secondLine).toBe("checks");
    expect(fillText.mock.calls[0][1]).toBe(75); // horizontally centered
  });

  it("renders the chart inside a fixed-width container", () => {
    const { container } = render(
      <SummaryChart passed={1} warnings={1} failed={1} information={1} total={4} />
    );

    const wrapper = container.firstElementChild;
    expect(wrapper.style.maxWidth).toBe("150px");
    expect(container.querySelector('[data-testid="mock-pie"]')).toBeDefined();
  });
});
