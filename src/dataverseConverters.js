/*
Dataverse JSON → dummy metadata format
*/

export function convertDataverse(dataverseRaw) {

  const dataset =
    dataverseRaw.data;

  const latest =
    dataset.latestVersion;

  const citationFields =
    latest.metadataBlocks
      .citation.fields;

  function getField(name) {

    return citationFields
      .find(f =>
        f.typeName === name
      );

  }

  // -------------------
  // title
  // -------------------
  const title =
    getField("title")
      ?.value || "";

  // -------------------
  // description
  // -------------------
  const short_description =
    getField("dsDescription")
      ?.value?.[0]
      ?.dsDescriptionValue
      ?.value || "";

  // -------------------
  // authors
  // -------------------
  const authors =
    getField("author")
      ?.value
      ?.map(a => ({

        name:
          a.authorName.value,

        affiliation:
          a.authorAffiliation
            ?.value,

        orcid:
          a.authorIdentifier
            ?.value

      })) || [];

  // -------------------
  // keywords
  // -------------------
  const keywords =
    getField("subject")
      ?.value || [];

  return {

    metadataIdentifier:
      dataset.identifier
        ?.toString(),

    identifier:
      latest.datasetPersistentId,

    doi:
      latest.datasetPersistentId,

    title,

    short_description,

    publicationDate:
      latest.publicationDate,

    authors,

    creators:
      authors,

    keywords,

    license:
      latest.license
        ?.name,
    url_download:
      latest.files?.map(g => g.code)
    .join("; ") || "",

      url_api:
      "https://dataverse.harvard.edu/api/datasets/:persistentId?persistentId="+latest.datasetPersistentId.toString() || "",

    accessLevel:
      "open",

    resourceType:
      dataset.datasetType,

    publisher:
      dataset.publisher,

    version:
      latest.versionNumber
        ?.toString()

  };

}