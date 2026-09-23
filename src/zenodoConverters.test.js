import { describe, it, expect } from "vitest";
import { convertZenodo } from "./zenodoConverters";

const zenodoRaw = {
  id: 13629087,
  links: {
    self: "https://zenodo.org/api/records/13629087",
  },
  metadata: {
    title: "Subglacial lake inventory",
    description: "<p>Plain <b>text</b> only.</p>",
    publication_date: "2024-08-20",
    doi: "10.5281/zenodo.13629087",
    creators: [
      {
        name: "Doe, Jane",
        affiliation: "Uni A",
        orcid: "0000-0001-2222-3333",
      },
    ],
    keywords: ["glaciology"],
    license: { id: "cc-by-4.0" },
    language: "eng",
    access_right: "open",
    resource_type: { title: "Dataset" },
    grants: [{ code: "ABC", funder: {name: "ABC" }}],
  },
  files: [
    { links: { self: "https://zenodo.org/api/records/13629087/files/data.zip" } },
  ],
};

describe("convertZenodo (src)", () => {
  it("maps a full Zenodo record to the FRAME metadata format", () => {
    const md = convertZenodo(zenodoRaw);

    expect(md.id).toBe("13629087");
    expect(md.url_page).toBe("https://zenodo.org/records/13629087");
    expect(md.title).toBe("Subglacial lake inventory");
    expect(md.short_description).toBe("Plain text only.");
    expect(md.publicationDate).toBe("2024-08-20");
    expect(md.doi).toBe("https://doi.org/10.5281/zenodo.13629087");
    expect(md.authors).toEqual([
      {
        name: "Doe, Jane",
        affiliation: "Uni A",
        orcid: "0000-0001-2222-3333",
      },
    ]);
    expect(md.creators).toEqual(md.authors);
    expect(md.keywords).toEqual(["glaciology"]);
    expect(md.license).toBe("cc-by-4.0");
    expect(md.language).toBe("eng");
    expect(md.accessLevel).toBe("open");
    expect(md.resourceType).toBe("Dataset");
    expect(md.url_api).toBe("https://zenodo.org/api/records/13629087");
    expect(md.url_download).toBe(
      "https://zenodo.org/api/records/13629087/files/data.zip"
    );
    expect(md.award).toBe("ABC");
    expect(md.fundername).toBe("ABC");
    expect(md.publisher).toBe("Zenodo");
    expect(md.version).toBe("1.0");
  });

  it("does not throw when the record has no files (unlike the core converter)", () => {
    const md = convertZenodo({ id: 9, metadata: { title: "No files" } });

    expect(md.url_download).toBe("");
    expect(md.url_api).toBe("");
    expect(md.title).toBe("No files");
    expect(md.doi).toBe("");
    expect(md.license).toBe("unknown");
  });

  it("falls back to defaults for missing optional fields", () => {
    const md = convertZenodo({
      id: 0,
      metadata: {},
      files: [{ links: { self: "https://f" } }],
    });

    expect(md.id).toBe("");
    expect(md.title).toBe("");
    expect(md.short_description).toBe("");
    expect(md.authors).toEqual([]);
    expect(md.license).toBe("unknown");
    expect(md.award).toBe("");
  });
});
