import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export async function isValidDownloadUrl(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow"
    });
    const contentType =
      response.headers.get("content-type") || "";

    const contentLength =
      response.headers.get("content-length");

    if (!response.ok) {
      return false;
    }

    if (contentType.includes("text/html")) {
      return false;
    }

    if (contentLength !== null && Number(contentLength) <= 0) {
      return false;
    }

      return {
      validUrl: true,
      url,
    };

  } catch {
    return false;
  }
}