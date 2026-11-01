export function baseUrls() {
  return {
    crossref: process.env.CROSSREF_BASE_URL || "https://api.crossref.org",
    openLibrary: process.env.OPENLIBRARY_BASE_URL || "https://openlibrary.org",
    arxiv: process.env.ARXIV_BASE_URL || "https://export.arxiv.org",
    email: process.env.CROSSREF_EMAIL || "",
  };
}
