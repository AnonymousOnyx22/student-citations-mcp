export function baseUrls() {
  return {
    crossref: process.env.CROSSREF_BASE_URL || "https://api.crossref.org",
    openLibrary: process.env.OPENLIBRARY_BASE_URL || "https://openlibrary.org",
    email: process.env.CROSSREF_EMAIL || "",
  };
}
