import { describe, it, expect } from "vitest";
import { normalizeUrl, pageSource, parsePage, parsePageDate } from "../src/page.js";

const url = "https://example.edu/study";

describe("parsePage", () => {
  it("reads the title, site name and date from open graph tags", () => {
    const html = [
      "<html><head>",
      '<meta property="og:title" content="How to study">',
      '<meta property="og:site_name" content="Example University">',
      '<meta property="article:published_time" content="2026-10-14T09:00:00Z">',
      "</head><body></body></html>",
    ].join("");
    expect(parsePage(html, url)).toEqual({
      title: "How to study",
      siteName: "Example University",
      year: "2026",
      month: 10,
      day: 14,
    });
  });

  it("falls back to the title element and the host name", () => {
    const html = "<html><head><title>A plain page</title></head></html>";
    expect(parsePage(html, "https://www.example.edu/study")).toEqual({
      title: "A plain page",
      siteName: "example.edu",
    });
  });

  it("splits a site name off the title element", () => {
    const html = "<html><head><title>Pipe Title | Pipe Site</title></head></html>";
    expect(parsePage(html, url)).toMatchObject({ title: "Pipe Title", siteName: "Pipe Site" });
  });

  it("takes the site name off the end of the title when a meta tag repeats it", () => {
    const html = [
      "<html><head>",
      '<meta property="og:title" content="Study tips: Example University">',
      '<meta property="og:site_name" content="Example University">',
      "</head></html>",
    ].join("");
    expect(parsePage(html, url).title).toBe("Study tips");
  });

  it("reads the date from a JSON-LD block when no meta tag gives it", () => {
    const html = [
      "<html><head>",
      "<title>News page</title>",
      '<script type="application/ld+json">{"@type":"NewsArticle","datePublished":"2026-09-01T12:00:00Z"}</script>',
      "</head></html>",
    ].join("");
    expect(parsePage(html, url)).toMatchObject({ year: "2026", month: 9, day: 1 });
  });

  it("reads a dateCreated JSON-LD value as well", () => {
    const html = '<html><head><title>Page</title><script>{"dateCreated":"2025-03-02"}</script></head></html>';
    expect(parsePage(html, url)).toMatchObject({ year: "2025", month: 3, day: 2 });
  });

  it("reads twitter titles, application names and a date meta tag", () => {
    const html = [
      "<html><head>",
      '<meta name="twitter:title" content="Twitter Title">',
      '<meta name="application-name" content="Twitter Site">',
      '<meta name="date" content="2026-07-10">',
      "</head></html>",
    ].join("");
    expect(parsePage(html, url)).toEqual({
      title: "Twitter Title",
      siteName: "Twitter Site",
      year: "2026",
      month: 7,
      day: 10,
    });
  });

  it("reads the date from a time element when nothing else gives it", () => {
    const html = [
      "<html><head><title>Time Page</title></head>",
      '<body><time datetime="2026-08-05">August 5, 2026</time></body></html>',
    ].join("");
    expect(parsePage(html, url)).toMatchObject({ title: "Time Page", year: "2026", month: 8, day: 5 });
  });

  it("keeps the first value of a meta key and decodes entities", () => {
    const html = [
      "<html><head>",
      '<meta property="og:title" content="Study&nbsp;tips &amp; notes">',
      '<meta property="og:title" content="A later title">',
      '<meta property="og:site_name" content="Example &amp; Co">',
      "</head></html>",
    ].join("");
    expect(parsePage(html, url)).toMatchObject({ title: "Study tips & notes", siteName: "Example & Co" });
  });

  it("returns an empty title when the page has none", () => {
    const page = parsePage("<html><head></head></html>", url);
    expect(page.title).toBe("");
    expect(page.siteName).toBe("example.edu");
  });

  it("leaves the site name out when the address is not a URL", () => {
    const page = parsePage("<html><head><title>Page</title></head></html>", "not a URL");
    expect(page).toEqual({ title: "Page", siteName: undefined });
  });
});

describe("parsePageDate", () => {
  it("reads ISO dates with or without a time", () => {
    expect(parsePageDate("2026-10-14")).toEqual({ year: "2026", month: 10, day: 14 });
    expect(parsePageDate("2026-10-14T09:00:00Z")).toEqual({ year: "2026", month: 10, day: 14 });
    expect(parsePageDate("2026/1/5")).toEqual({ year: "2026", month: 1, day: 5 });
  });

  it("reads a written date with the day before the month", () => {
    expect(parsePageDate("14 October 2026")).toEqual({ year: "2026", month: 10, day: 14 });
    expect(parsePageDate("1 Sep. 2026")).toEqual({ year: "2026", month: 9, day: 1 });
    expect(parsePageDate("October 14, 2026")).toEqual({ year: "2026", month: 10, day: 14 });
    expect(parsePageDate("14th October 2026")).toEqual({ year: "2026", month: 10, day: 14 });
  });

  it("keeps a month with no day", () => {
    expect(parsePageDate("October 2026")).toEqual({ year: "2026", month: 10 });
    expect(parsePageDate("Oct. 2026")).toEqual({ year: "2026", month: 10 });
  });

  it("keeps a year with no month", () => {
    expect(parsePageDate("Published in 2024")).toEqual({ year: "2024" });
    expect(parsePageDate("2026-13-40")).toEqual({ year: "2026" });
  });

  it("gives nothing for blank text or text with no year", () => {
    expect(parsePageDate()).toBeUndefined();
    expect(parsePageDate("")).toBeUndefined();
    expect(parsePageDate("last autumn")).toBeUndefined();
  });
});

describe("normalizeUrl", () => {
  it("adds a scheme when the address has none", () => {
    expect(normalizeUrl("example.edu/study")).toBe("https://example.edu/study");
    expect(normalizeUrl("  https://example.edu/study  ")).toBe("https://example.edu/study");
  });

  it("keeps http and normalises the scheme and host", () => {
    expect(normalizeUrl("http://example.edu/study")).toBe("http://example.edu/study");
    expect(normalizeUrl("HTTPS://EXAMPLE.EDU/Study")).toBe("https://example.edu/Study");
  });

  it("rejects anything that is not a web address", () => {
    expect(() => normalizeUrl("not a web address")).toThrow("does not look like a web address");
    expect(() => normalizeUrl("ftp://example.edu/file")).toThrow("does not look like a web address");
  });
});

describe("pageSource", () => {
  const page = {
    title: "How to study",
    siteName: "Example University",
    year: "2026",
    month: 10,
    day: 14,
  };

  it("makes a website source with the page title, site name and url", () => {
    expect(pageSource(page, url, "harvard")).toEqual({
      type: "website",
      authors: [],
      title: "How to study",
      container: "Example University",
      url,
      year: "2026",
    });
  });

  it("writes the date in the form APA 7 and MLA 9 use", () => {
    expect(pageSource(page, url, "apa7").published).toBe("2026, October 14");
    expect(pageSource(page, url, "mla9").date_text).toBe("14 Oct. 2026");
  });

  it("leaves the day out when the page gives only a month", () => {
    const monthOnly = { title: "How to study", siteName: "Example University", year: "2026", month: 10 };
    expect(pageSource(monthOnly, url, "apa7").published).toBe("2026, October");
    expect(pageSource(monthOnly, url, "mla9").date_text).toBe("Oct. 2026");
  });

  it("leaves the date text out when the page gives only a year", () => {
    const source = pageSource({ title: "How to study", year: "2026" }, url, "apa7");
    expect(source.year).toBe("2026");
    expect(source.published).toBeUndefined();
    expect(source.date_text).toBeUndefined();
    expect(source.container).toBeUndefined();
  });
});
