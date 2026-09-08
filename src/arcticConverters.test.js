import { describe, it, expect } from "vitest";
import { convertArcticXML } from "./arcticConverters";

const objectUrl =
  "https://arcticdata.io/metacat/d1/mn/v2/object/doi%3A10.18739%2FA2RX93F75";

const emlJson = {
  eml: {
    dataset: {
      title: "Subglacial water bodies",
      abstract: { para: "This dataset describes 37 lakes." },
      pubDate: "2024-09-15",
      creator: [
        {
          individualName: { givenName: "Jane", surName: "Doe" },
          organizationName: "Polar Institute",
        },
      ],
      contact: { electronicMailAddress: "contact@arctic.org" },
      keywordSet: { keyword: ["glaciology", "radar"] },
      methods: {
        methodStep: [
          {
            description: {
              section: { title: "Inventory", para: "How lakes were found." },
            },
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

describe("convertArcticXML (src)", () => {
  it("builds the identifier from the object url", () => {
    const md = convertArcticXML(objectUrl, emlJson);

    expect(md.id).toBe("doi:10.18739/A2RX93F75");
    expect(md.metadataIdentifier).toBe("doi:10.18739/A2RX93F75");
    expect(md.url_page).toBe(objectUrl);
    expect(md.doi).toBe("https://doi.org/10.18739/A2RX93F75");
  });

  it("converts a full EML document to the FRAME metadata format", () => {
    const md = convertArcticXML(objectUrl, emlJson);

    expect(md.title).toBe("Subglacial water bodies");
    expect(md.short_description).toBe("This dataset describes 37 lakes.");
    expect(md.publicationDate).toBe("2024-09-15");
    expect(md.authors).toEqual([
      { name: "Jane Doe", affiliation: "Polar Institute" },
    ]);
    expect(md.corresponding_author).toBe("contact@arctic.org");
    expect(md.keywords).toEqual(["glaciology", "radar"]);
    expect(md.license).toBe("Creative Commons Attribution");
    expect(md.award).toBe("NSF-999");
    expect(md.spatialExtent).toEqual({ northBoundingCoordinate: "83.0" });
    expect(md.documentation).toContain("Inventory");
    expect(md.documentation).toContain("How lakes were found.");
    expect(md.documentation).toContain("Sampling description.");
    expect(md.url_download).toBe(
      "https://arcticdata.io/metacat/d1/mn/v2/packages/application%2Fbagit-1.0/resource_map_doi:10.18739/A2RX93F75"
    );
    expect(md.url_api).toBe(
      "https://arcticdata.io/metacat/d1/mn/v2/object/doi:10.18739/A2RX93F75"
    );
  });

  it("sets static repository-level fields", () => {
    const md = convertArcticXML(objectUrl, emlJson);

    
    expect(md.accessLevel).toBe("open");
    expect(md.publisher).toBe("Arctic Data Center");
    expect(md.resourceType).toBe("dataset");
    expect(md.version).toBe("1.0");
  });

  it("does not throw when optional fields are missing (contact included)", () => {
    const md = convertArcticXML(objectUrl, { eml: { dataset: {} } });

    expect(md.title).toBe("");
    expect(md.authors).toEqual([]);
    expect(md.corresponding_author).toBe("");
    expect(md.documentation).toBe("");
    expect(md.keywords).toEqual([]);
    expect(md.id).toBe("doi:10.18739/A2RX93F75");
  });

    it("extracts text from xml-js style '#text' nodes", () => {
    const md = convertArcticXML(objectUrl, {
      dataset: {
        title: { "#text": "Node title" },
        abstract: { para: { "#text": "Node abstract" } },
        contact: { electronicMailAddress: "x@y.org" },
      },
    });

   expect(md.title).toBe("Node title");
    expect(md.short_description).toBe("Node abstract");
  });

  it("uses packageId when identifier is missing", () => {
  const xmlJson = {
    "@_packageId": "urn:uuid:6ed1397f-880b-4796-9587-445b5ce53719",
    eml: {
      dataset: {},
    },
  };

  const md = convertArcticXML("", xmlJson);

  expect(md.doi).toBe("");
  expect(md.id).toBe(
    "urn:uuid:6ed1397f-880b-4796-9587-445b5ce53719"
  );
});
    
});
