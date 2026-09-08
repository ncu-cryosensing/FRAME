import { describe, it, expect } from "vitest";
import { convertDataverse } from "./dataverseConverters";

const dataverseRaw = {
  data: {
    identifier: "FK2/ES8GTH",
    datasetType: "dataset",
    publisher: "Harvard Dataverse",
    latestVersion: {
      datasetPersistentId: "doi:10.7910/DVN/ES8GTH",
      publicationDate: "2020-11-19",
      versionNumber: 3,
      license: { name: "CC0 1.0" },
      files: [{ code: "file1" }, { code: "file2" }],
      metadataBlocks: {
        citation: {
          fields: [
            { typeName: "title", value: "Glacier velocity dataset" },
            {
              typeName: "dsDescription",
              value: [
                {
                  dsDescriptionValue: {
                    value: "Velocity maps derived from sentinel-1 imagery.",
                  },
                },
              ],
            },
            {
              typeName: "author",
              value: [
                {
                  authorName: { value: "Doe, Jane" },
                  authorAffiliation: { value: "Uni A" },
                  authorIdentifier: { value: "0000-0001-2222-3333" },
                },
                {
                  authorName: { value: "Roe, John" },
                },
              ],
            },
            { typeName: "subject", value: ["Glaciology", "Remote Sensing"] },
          ],
        },
      },
    },
  },
};

describe("convertDataverse", () => {
  it("maps a full Dataverse dataset to the FRAME metadata format", () => {
    const md = convertDataverse(dataverseRaw);

    expect(md.id).toBe("doi:10.7910/DVN/ES8GTH");
    expect(md.metadataIdentifier).toBe("FK2/ES8GTH");
    expect(md.identifier).toBe("doi:10.7910/DVN/ES8GTH");
    expect(md.url_page).toBe(
      "https://dataverse.harvard.edu/api/datasets/:persistentId?persistentId=doi:10.7910/DVN/ES8GTH"
    );
    expect(md.doi).toBe("https://doi.org/10.7910/DVN/ES8GTH");
    expect(md.title).toBe("Glacier velocity dataset");
    expect(md.short_description).toBe(
      "Velocity maps derived from sentinel-1 imagery."
    );
    expect(md.publicationDate).toBe("2020-11-19");
    expect(md.authors).toEqual([
      {
        name: "Doe, Jane",
        affiliation: "Uni A",
        orcid: "0000-0001-2222-3333",
      },
      { name: "Roe, John", affiliation: undefined, orcid: undefined },
    ]);
    expect(md.creators).toEqual(md.authors);
    expect(md.keywords).toEqual(["Glaciology", "Remote Sensing"]);
    expect(md.license).toBe("CC0 1.0");
    expect(md.accessLevel).toBe("open");
    expect(md.resourceType).toBe("dataset");
    expect(md.publisher).toBe("Harvard Dataverse");
    expect(md.version).toBe("3");
  });

  it("joins the file codes for url_download", () => {
    const md = convertDataverse(dataverseRaw);
    expect(md.url_download).toBe("file1; file2");
  });

  it("uses an empty url_download when no files are present", () => {
    const raw = JSON.parse(JSON.stringify(dataverseRaw));
    raw.data.latestVersion.files = undefined;

    const md = convertDataverse(raw);
    expect(md.url_download).toBe("");
  });

  it("returns empty strings for missing citation fields", () => {
    const raw = JSON.parse(JSON.stringify(dataverseRaw));
    raw.data.latestVersion.metadataBlocks.citation.fields = [];

    const md = convertDataverse(raw);

    expect(md.title).toBe("");
    expect(md.short_description).toBe("");
    expect(md.authors).toEqual([]);
    expect(md.keywords).toEqual([]);
  });
});
