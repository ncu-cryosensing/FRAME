// src/utils/metadataConverters.js

/*
Convert Zenodo JSON → dummy-metadata.json structure
compatible with FAIR checker
*/

export function convertZenodo(zenodoRaw) {

  const md =
    zenodoRaw.metadata || zenodoRaw;
const md1 = zenodoRaw;
  return {

    title:
      md.title || "",

    short_description:
      md.description
        ?.replace(/<[^>]+>/g, '')
        .trim() || "",

    publicationDate:
      md.publication_date || "",

    metadataIdentifier:
      zenodoRaw.id
        ? `${zenodoRaw.id}`
        : "",

    doi:
      md.doi || "",

    authors:
      (md.creators || [])
        .map(a => ({

          name:
            a.name,

          affiliation:
            a.affiliation,

          orcid:
            a.orcid

        })),

    creators:
      (md.creators || [])
        .map(a => ({

          name:
            a.name,

          affiliation:
            a.affiliation,

          orcid:
            a.orcid

        })),

    keywords:
      md.keywords || [],

    license:
      md.license?.id
      || md.license
      || "unknown",

    language:
      md.language || "",

    accessLevel:
      md.access_right || "",

    resourceType:
      md.resource_type?.title || "",
    url_api:
      md1.links?.self || "",
    url_download:
      md1.files[0].links.self || "",
    award:
  md.grants
    ?.map(g => g.code)
    .join("; ")
  || "",

    publisher:
      "Zenodo",

    version:
      "1.0"

  };

}