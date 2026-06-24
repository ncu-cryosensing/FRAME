export function convertArcticXML(xmlJson) {

  const ds =
    xmlJson?.eml?.dataset
    || xmlJson?.dataset
    || {};

  /* -----------------------------
   helper: convert XML value -> text
  ------------------------------*/
  function getText(value) {

    if (!value) return "";

    // already string
    if (typeof value === "string")
      return value;

    // array
    if (Array.isArray(value))
      return value
        .map(getText)
        .join(" ");

    // xml-js style { "#text": "...." }
    if (typeof value === "object") {

      if (value["#text"])
        return value["#text"];

      // if nested object
      return Object.values(value)
        .map(getText)
        .join(" ");
    }

    return String(value);
  }

  /* -----------------------------
   creators
  ------------------------------*/
  const creators =
    [].concat(ds.creator || [])
      .map(c => {

        const given =
          getText(
            c.individualName
              ?.givenName
          );

        const sur =
          getText(
            c.individualName
              ?.surName
          );

        return {

          name:
            `${given} ${sur}`
              .trim(),

          affiliation:
            getText(
              c.organizationName
            )

        };

      });

  /* -----------------------------
   keywords
  ------------------------------*/
  const keywords =
    [].concat(
      ds.keywordSet
        ?.keyword
      || []
    )
      .map(getText);

  /* -----------------------------
   documentation (methods)
  ------------------------------*/
  const documentation = [

    ...(ds.methods?.methodStep || [])
      .map(step => {

        const title =
          getText(
            step.description
              ?.section
              ?.title
          );

        const sectionPara =
          getText(
            step.description
              ?.section
              ?.para
          );

        const para =
          getText(
            step.description
              ?.para
          );

        return [
          title,
          sectionPara,
          para
        ]
          .filter(Boolean)
          .join("\n");

      }),

    getText(
      ds.methods
        ?.sampling
        ?.samplingDescription
        ?.para
    )

  ]
    .filter(Boolean)
    .join("\n\n");

  /* -----------------------------
   result
  ------------------------------*/
  return {

    metadataIdentifier:
      ds?.["@_id"]
      || "",

    doi:
      "doi:10.18739/AXXXXXX",

    title:
      getText(ds.title),

    short_description:
      getText(
        ds.abstract
          ?.para
      ),

    documentation,

    publicationDate:
      getText(ds.pubDate),

    authors:
      creators,

    corresponding_author:
      getText(
        ds.contact?.electronicMailAddress || ds.contact[0]?.electronicMailAddress
      ),

    creators,

    spatialExtent:
      ds.coverage
        ?.geographicCoverage
        ?.boundingCoordinates
      || "",

    keywords,

    license:
      getText(
        ds.intellectualRights
          ?.para
      ),

    award:
      getText(
        ds.project
          ?.award[0]
          ?.awardNumber || ds.project
          ?.award
          ?.awardNumber
      ),

      url_download:
      "https://arcticdata.io/metacat/d1/mn/v2/packages/application%2Fbagit-1.0/resource_map" || "",

      url_api:
      "https://arcticdata.io/metacat/d1/mn/v2/object/" || "",

    accessLevel:
      "open",

    publisher:
      "Arctic Data Center",

    resourceType:
      "dataset",

    version:
      "1.0"

  };

}