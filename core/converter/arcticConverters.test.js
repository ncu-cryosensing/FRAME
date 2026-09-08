import { describe, it, expect } from "vitest";
import { convertArcticXML } from "./arcticConverters.js";

const emlJson = {
  eml: {
    dataset: {
      "@_id": "doi:10.18739/A2RX93F75",
      title: "Subglacial water bodies",
      abstract: { para: "This dataset describes 37 lakes." },
      pubDate: "2024-09-15",
      creator: [
        {
          individualName: { givenName: "Jane", surName: "Doe" },
          organizationName: "Polar Institute",
        },
        { individualName: { givenName: "John", surName: "Roe" } },
      ],
      contact: {
        electronicMailAddress: "contact@arctic.org",
      },
      keywordSet: { keyword: ["glaciology", "radar"] },
      methods: {
        methodStep: [
          {
            description: {
              section: {
                title: "Inventory",
                para: "How the lakes were identified.",
              },
            },
          },
          {
            description: { para: "A plain step paragraph." },
          },
        ],
        sampling: { samplingDescription: { para: "Sampling description." } },
      },
      intellectualRights: { para: "Creative Commons Attribution" },
      project: { award: [{ awardNumber: "NSF-999" }] },
      coverage: {
        geographicCoverage: {
          boundingCoordinates: { northBoundingCoordinate: "83.0" },
        },
      },
    },
  },
};

describe("convertArcticXML (core)", () => {
  it("converts a full EML document to the FRAME metadata format", () => {
    const md = convertArcticXML(emlJson);

    expect(md.id).toBe("doi:10.18739/A2RX93F75");
    expect(md.metadataIdentifier).toBe("doi:10.18739/A2RX93F75");
    expect(md.title).toBe("Subglacial water bodies");
    expect(md.short_description).toBe("This dataset describes 37 lakes.");
    expect(md.publicationDate).toBe("2024-09-15");
    expect(md.authors).toEqual([
      { name: "Jane Doe", affiliation: "Polar Institute" },
      { name: "John Roe", affiliation: "" },
    ]);
    expect(md.creators).toEqual(md.authors);
    expect(md.corresponding_author).toBe("contact@arctic.org");
    expect(md.keywords).toEqual(["glaciology", "radar"]);
    expect(md.license).toBe("Creative Commons Attribution");
    expect(md.award).toBe("NSF-999");
    expect(md.spatialExtent).toEqual({
      northBoundingCoordinate: "83.0",
    });
    expect(md.publisher).toBe("Arctic Data Center");
    expect(md.accessLevel).toBe("open");
    expect(md.resourceType).toBe("dataset");
    expect(md.version).toBe("1.0");
  });

  it("joins documentation sections and sampling description", () => {
    const md = convertArcticXML(emlJson);

    expect(md.documentation).toContain("Inventory");
    expect(md.documentation).toContain("How the lakes were identified.");
    expect(md.documentation).toContain("A plain step paragraph.");
    expect(md.documentation).toContain("Sampling description.");
  });

  it("supports a contact list and picks the first address", () => {
    const md = convertArcticXML({
      dataset: {
        ...emlJson.eml.dataset,
        contact: [
          { electronicMailAddress: "first@arctic.org" },
          { electronicMailAddress: "second@arctic.org" },
        ],
      },
    });

    expect(md.corresponding_author).toBe("first@arctic.org");
  });

  it("supports a flat dataset object (without the eml wrapper)", () => {
    const md = convertArcticXML({ dataset: emlJson.eml.dataset });

    expect(md.title).toBe("Subglacial water bodies");
  });

  it("throws when the dataset has no contact entry (current core-converter behavior)", () => {
    // the core converter accesses ds.contact[0] without optional chaining,
    // so a dataset without `contact` cannot be converted today
    expect(() => convertArcticXML({})).toThrow(TypeError);
  });

  it("returns empty strings for fields that are absent (with contact present)", () => {
    const md = convertArcticXML({
      dataset: { contact: { electronicMailAddress: "x@y.org" } },
    });

    expect(md.id).toBe("");
    expect(md.title).toBe("");
    expect(md.short_description).toBe("");
    expect(md.documentation).toBe("");
    expect(md.keywords).toEqual([]);
    expect(md.authors).toEqual([]);
    expect(md.spatialExtent).toBe("");
    expect(md.license).toBe("");
    expect(md.award).toBe("");
  });

  it("extracts text from xml-js style '#text' nodes", () => {
    const md = convertArcticXML({
      dataset: {
        title: { "#text": "Node title" },
        abstract: { para: { "#text": "Node abstract" } },
        contact: { electronicMailAddress: "x@y.org" },
      },
    });

    expect(md.title).toBe("Node title");
    expect(md.short_description).toBe("Node abstract");
  });
});
