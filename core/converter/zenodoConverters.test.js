import { describe, it, expect } from "vitest";
import { convertZenodo } from "./zenodoConverters.js";

const zenodoRaw = {
  id: 13629087,
  links: {
    self: "https://zenodo.org/api/records/13629087",
  },
  metadata: {
    title: "Subglacial lake inventory",
    description: "<p>A <b>description</b> with HTML tags.</p>",
    publication_date: "2024-08-20",
    doi: "10.5281/zenodo.13629087",
    creators: [
      {
        name: "Doe, Jane",
        affiliation: "Uni A",
        orcid: "0000-0001-2222-3333",
      },
      { name: "Roe, John", affiliation: "Uni B" },
    ],
    keywords: ["glaciology", "subglacial lakes"],
    license: { id: "cc-by-4.0" },
    language: "eng",
    access_right: "open",
    resource_type: { title: "Dataset" },
    grants: [{ code: "12345" }, { code: "67890" }],
  },
  files: [
    {
      links: {
        self: "https://zenodo.org/api/records/13629087/files/data.zip",
      },
    },
  ],
};

describe("convertZenodo (core)", () => {
  it("maps a full Zenodo record to the FRAME metadata format", () => {
    const md = convertZenodo(zenodoRaw);

    expect(md.id).toBe("13629087");
    expect(md.url_page).toBe("https://zenodo.org/records/13629087");
    expect(md.title).toBe("Subglacial lake inventory");
    expect(md.short_description).toBe("A description with HTML tags.");
    expect(md.publicationDate).toBe("2024-08-20");
    expect(md.metadataIdentifier).toBe("13629087");
    expect(md.doi).toBe("10.5281/zenodo.13629087");
    expect(md.authors).toHaveLength(2);
    expect(md.authors[0]).toEqual({
      name: "Doe, Jane",
      affiliation: "Uni A",
      orcid: "0000-0001-2222-3333",
    });
    expect(md.creators).toEqual(md.authors);
    expect(md.keywords).toEqual(["glaciology", "subglacial lakes"]);
    expect(md.license).toBe("cc-by-4.0");
    expect(md.language).toBe("eng");
    expect(md.accessLevel).toBe("open");
    expect(md.resourceType).toBe("Dataset");
    expect(md.url_api).toBe("https://zenodo.org/api/records/13629087");
    expect(md.url_download).toBe(
      "https://zenodo.org/api/records/13629087/files/data.zip"
    );
    expect(md.award).toBe("12345; 67890");
    expect(md.publisher).toBe("Zenodo");
    expect(md.version).toBe("1.0");
  });

  it("accepts a payload that already is the metadata object", () => {
    const md = convertZenodo({
      id: 1,
      files: [{ links: { self: "https://f" } }],
      title: "Flat title",
      description: "plain",
      license: "cc0",
    });

    expect(md.title).toBe("Flat title");
    expect(md.short_description).toBe("plain");
    expect(md.license).toBe("cc0");
    expect(md.url_page).toBe("https://zenodo.org/records/1");
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
    expect(md.publicationDate).toBe("");
    expect(md.doi).toBe("");
    expect(md.authors).toEqual([]);
    expect(md.keywords).toEqual([]);
    expect(md.license).toBe("unknown");
    expect(md.language).toBe("");
    expect(md.award).toBe("");
  });

  it("uses a string license when no license object is provided", () => {
    const md = convertZenodo({
      id: 5,
      metadata: { license: "mit" },
      files: [{ links: { self: "https://f" } }],
    });

    expect(md.license).toBe("mit");
  });

  it("throws when the record has no files list (current behavior)", () => {
    // core converter accesses files[0] without optional chaining
    expect(() =>
      convertZenodo({ id: 7, metadata: { title: "x" } })
    ).toThrow();
  });
});
