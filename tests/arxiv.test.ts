import { describe, it, expect } from "vitest";
import { normalizeArxivId, arxivAbsUrl } from "../src/core/arxiv.js";

describe("normalizeArxivId", () => {
  it("keeps a new style arXiv ID as it is", () => {
    expect(normalizeArxivId("2001.00001")).toBe("2001.00001");
  });

  it("strips a version suffix", () => {
    expect(normalizeArxivId("2001.00001v2")).toBe("2001.00001");
    expect(normalizeArxivId("2001.00001v12")).toBe("2001.00001");
  });

  it("takes an old style archive ID", () => {
    expect(normalizeArxivId("math/0603452")).toBe("math/0603452");
    expect(normalizeArxivId("quant-ph/9901001")).toBe("quant-ph/9901001");
    expect(normalizeArxivId("cs.AI/0603452")).toBe("cs.AI/0603452");
  });

  it("takes an abs link with or without a scheme", () => {
    expect(normalizeArxivId("https://arxiv.org/abs/2001.00001")).toBe("2001.00001");
    expect(normalizeArxivId("http://arxiv.org/abs/2001.00001v3")).toBe("2001.00001");
    expect(normalizeArxivId("arxiv.org/abs/math/0603452")).toBe("math/0603452");
  });

  it("takes a pdf link", () => {
    expect(normalizeArxivId("https://arxiv.org/pdf/2001.00001")).toBe("2001.00001");
  });

  it("trims spaces", () => {
    expect(normalizeArxivId("  2001.00001  ")).toBe("2001.00001");
  });

  it("rejects anything else", () => {
    expect(() => normalizeArxivId("hello")).toThrow("does not look like an arXiv ID");
    expect(() => normalizeArxivId("10.1038/nature14539")).toThrow("does not look like an arXiv ID");
    expect(() => normalizeArxivId("2001.0000")).toThrow("does not look like an arXiv ID");
    expect(() => normalizeArxivId("math/060345")).toThrow("does not look like an arXiv ID");
    expect(() => normalizeArxivId("")).toThrow("does not look like an arXiv ID");
  });
});

describe("arxivAbsUrl", () => {
  it("builds the abstract page address", () => {
    expect(arxivAbsUrl("2001.00001")).toBe("https://arxiv.org/abs/2001.00001");
    expect(arxivAbsUrl("math/0603452")).toBe("https://arxiv.org/abs/math/0603452");
  });
});
