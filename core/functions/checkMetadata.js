import { evaluateAIQuality } from "./evaluateAIQuality.js";
import { evaluateRule } from "./evaluateRule.js";
import { replaceTemplate } from "./replaceTemplate.js";
import { addResult } from "./addResult.js";
import { isValidUrl } from "./isValidUrl.js";
import { isValidDownloadUrl } from "./isValidDownloadUrl.js";


export async function checkMetadata(md, rules) {
 const aiQuality = await evaluateAIQuality(md);
const validurl = await isValidUrl(md.url_page, md.title)
const validdownload = await isValidDownloadUrl(md.url_download)

 const result = {

    totalChecks: 0,

    totalScores: {
      Findable: 0,
      Accessible: 0,
      Interoperable: 0,
      Reusable: 0,
    },

    passed: 0,
    warnings: 0,
    failed: 0,
    informational: 0,

    passedScores: {
      Findable: 0,
      Accessible: 0,
      Interoperable: 0,
      Reusable: 0,
    },

    passedChecks: [],
    warningChecks: [],
    failedChecks: [],
    informationalCheck: [],
  };
 for (const rule of rules.checks) {

    const {
      condition,
      context,
    } = await evaluateRule(
      md,
      rule,
      aiQuality, 
      validurl,
        validdownload
    );


    const successMsg =
      replaceTemplate(
        rule.successMsg,
        context
      );


    const failureMsg =
      replaceTemplate(
        rule.failureMsg,
        context
      );


    addResult(
      result,
      condition,
      successMsg,
      failureMsg,
      rule.level,
      rule.principle
    );
  }
 for (const rule of rules.info) {

    const {
      condition,  context
    } = await evaluateRule(
      md,
      rule,
      aiQuality, 
      validurl,
        validdownload
    );
    if (condition) {

      result.informational++;

      result.informationalCheck.push({

        message:
          replaceTemplate(
            rule.message, context
          ),

        level: "INFO",

        principle:
          rule.principle,
      });
    }
  }


  return result;
}