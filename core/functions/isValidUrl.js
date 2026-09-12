import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export async function isValidUrl(UrlPage, datasetTitle) {
  try {
    const response = await fetch(UrlPage, {
      method: "GET",
      redirect: "follow",
       headers: {
    "Accept": "application/json",
    "User-Agent": "TaiPI-Data-Repository/1.0",
  },
    });

    if (!response.ok) {
      return {
        validUrl: false,
        UrlPage,
      };
    }

if (
  UrlPage?.startsWith(
    "https://arcticdata.io/metacat/d1/mn/v2/object/"
  )
) {
  const identifier = decodeURIComponent(UrlPage.split("/").pop())
  .replace(/^doi:/, "");

  UrlPage = `https://arcticdata.io/catalog/view/doi:${identifier}`;
}
      
 let pageTitle = null;

if (UrlPage?.startsWith("https://dataverse.harvard.edu/api/datasets/")) {
  const json = await response.json();

  const fields =
    json.data?.latestVersion?.metadataBlocks?.citation?.fields || [];

  pageTitle =
    fields.find(field => field.typeName === "title")?.value?.trim() ||
    null;

const identifier = UrlPage.split("persistentId=")[1];

  UrlPage = `https://dataverse.harvard.edu/dataset.xhtml?persistentId=${identifier}`;

} else {
  const html = await response.text();

  const dom = new JSDOM(html);
  const doc = dom.window.document;

  pageTitle =
    doc.querySelector('meta[property="og:title"]')?.content?.trim() ||
    doc.querySelector("h1")?.textContent?.trim() ||
    doc.querySelector("title")?.textContent?.trim() ||
    null;
}


    const normalize = (text) =>
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

    const text = normalize(pageTitle);
    const title = normalize(datasetTitle);
    
    

    return {
      validUrl: text.includes(title),
      UrlPage,
    };

      
  } catch (error) {
    console.error("URL validation failed:", error);

    return {
      validUrl: false,
      UrlPage,
    };
  }
}