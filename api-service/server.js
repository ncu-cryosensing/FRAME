import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";
import dotenv from "dotenv";


import { XMLParser }
from "fast-xml-parser";

import swaggerUi
from "swagger-ui-express";

import swaggerJsdoc
from "swagger-jsdoc";

import { convertZenodo }
from "./converter/zenodoConverters.js";

import { convertArcticXML }
from "./converter/arcticConverters.js";

dotenv.config();


const rules =
  JSON.parse(
    fs.readFileSync(
      "./rules.json",
      "utf-8"
    )
  );




const app = express();

app.use(cors());

app.use(express.json());




const swaggerSpec =
  swaggerJsdoc({

    definition: {

      openapi: "3.0.0",

      info: {

       title:
        "FRAME (FAIR Review and Metadata Evaluation Engine)",

      version: "1.0.0",

      description:
        "FRAME is a web-based tool to assess the quality and completeness of the metadata for a given dataset based on the FAIR (Findable, Accessible, Interoperable, and Reusable) principles"

    },

      servers: [

        {
          url:
            "http://localhost:3006"
        }

      ]

    },

    apis: ["./server.js"]

  });

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);




function countWords(text) {

  return (text || "")
    .split(/\s+/)
    .filter(Boolean)
    .length;

}

function replaceTemplate(
  msg,
  context
) {

  return msg
    .replace("{count}",
      context.count ?? "")
    .replace("{value}",
      context.value ?? "")
    .replace("{min}",
      context.min ?? "")
    .replace("{aiResult1}",
      context.aiResult1 ?? "")
    .replace("{aiResult2}",
      context.aiResult2 ?? "");

}



async function evaluateAIQuality(md) {

   
  try {

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          model: "openrouter/owl-alpha",
          messages: [
            {
              role: "user",
              content: `
Evaluate readability and informativeness.

Short Description:
${md.short_description || ""}

Documentation:
${md.documentation || ""}

Return ONLY valid JSON:

{
  "short_description": "Poor | Fair | Good",
  "documentation": "Poor | Fair | Good"
}
`
            }
          ]
        })
      }
    );

    if (
      response.status === 401 ||
      response.status === 429
    ) {

      return {
        short_description: null,
        documentation: null
      };

    }

    const data =
      await response.json();

    const content =
      data.choices?.[0]
        ?.message?.content;

    return JSON.parse(content);

  }

  catch {

    return {
      short_description: null,
      documentation: null
    };

  }

}



async function evaluateRule(
  md,
  rule, 
  aiQuality = {}
) {

  let value =
    md[rule.field];

  let count = 0;

  let condition = false;
  let aiResult1 = "";
  let aiResult2 = "";

  switch (rule.type) {

    case "exists":

      condition = !!value;

      break;

    case "wordCount":

      count =
        countWords(value);

      condition =
        count >= rule.min;

      break;

    case "arrayNotEmpty":

      condition =
        Array.isArray(value)
        &&
        value.length > 0;

      break;
        case "aiQuality1":

      if (!value) {

        condition = false;

        aiResult1 =
          "Short description is not present";

      }

      else if (
        !aiQuality.short_description
      ) {

        condition = false;

        aiResult1 =
          "AI failed to assess Short Description";

      }

      else {

        condition =
          aiQuality.short_description !==
          "Poor";

        aiResult1 =
          `Readability and informativeness for Short Description is ${aiQuality.short_description}`;

      }

      break;

    case "aiQuality2":

      if (!value) {

        condition = false;

        aiResult2 =
          "Documentation is not present";

      }

      else if (
        !aiQuality.documentation
      ) {

        condition = false;

        aiResult2 =
          "AI failed to assess Documentation";

      }

      else {

        condition =
          aiQuality.documentation !==
          "Poor";

        aiResult2 =
          `Readability and informativeness for Documentation is ${aiQuality.documentation}`;

      }

      break;

  }

  return {

    condition,

    context: {
  value,
  count,
  min: rule.min,
  aiResult1,
  aiResult2
}

  };

}



async function checkMetadata(md) {

    const aiQuality =
    await evaluateAIQuality(md);

 


  const result = {

    totalChecks: 0,

    passed: 0,

    warnings: 0,

    failed: 0,

    passedChecks: [],

    warningChecks: [],

    failedChecks: []

  };

  function addResult(
    condition,
    successMsg,
    failureMsg,
    level,
    principle
  ) {

    result.totalChecks++;

    if (condition) {

      result.passed++;

      result.passedChecks.push({

        message: successMsg,
        level,
        principle

      });

    }

    else {

      if (
        level === "REQUIRED"
      ) {

        result.failed++;

        result.failedChecks.push({

          message:
            failureMsg,

          level,

          principle

        });

      }

      else {

        result.warnings++;

        result.warningChecks.push({

          message:
            failureMsg,

          level,

          principle

        });

      }

    }

  }

 

  for (
    const rule
    of rules.checks
  ) {

    const {
      condition,
      context
    } =
      await evaluateRule(
        md,
        rule,
        aiQuality
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

      condition,

      successMsg,

      failureMsg,

      rule.level,

      rule.principle

    );

  }

  return result;

}




app.get("/", (req, res) => {
  res.redirect("/api/docs");
});


/**
 * @swagger
 * /api/assess:
 *   get:
 *     summary: Assess metadata
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *           example: https://taipidata.ncu.edu.tw/metadata-assessment/dummy-metadata.json
 *         required: true
 *         description: Metadata URL
 *     responses:
 *       200:
 *         description: Assessment result
 */

app.get(
  "/api/assess",

  async (req, res) => {

    try {

      const url =
        req.query.url;

      if (!url) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "url parameter required"

          });

      }

     
      const response =
        await fetch(url);

      if (!response.ok) {

        throw new Error(
          `HTTP ${response.status}`
        );

      }

      const contentType =
        (
          response.headers.get(
            "content-type"
          ) || ""
        ).toLowerCase();

      let raw;

      

      if (
        contentType.includes(
          "json"
        )
      ) {

        raw =
          await response.json();

        // Zenodo
        if (
          raw?.metadata?.creators
        ) {

          raw =
            convertZenodo(raw);

        }

      }

      // ======================
      // XML
      // ======================

      else {

        const text =
          await response.text();

        const parser =
          new XMLParser({

            ignoreAttributes:
              false

          });

        const parsed =
          parser.parse(text);

        // Arctic EML
        if (
          parsed["eml:eml"]
        ) {

          raw =
            convertArcticXML(
              parsed["eml:eml"]
            );

        }

        else {

          raw = parsed;

        }

      }


      const assessment =
        await checkMetadata(
          raw
        );

     

      res.json({

        success: true,

        assessment

      });

    }

    catch (err) {

      res.status(500)
        .json({

          success: false,

          error:
            err.message

        });

    }

  }
);




const PORT =
  process.env.PORT || 3006;

app.listen(
  PORT,
  () => {

    console.log(
      `Server running on http://localhost:${PORT}`
    );

  }
);