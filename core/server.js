import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";
import dotenv from "dotenv";

import { XMLParser } from "fast-xml-parser";

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import { convertZenodo }
  from "./converter/zenodoConverters.js";

import { convertArcticXML }
  from "./converter/arcticConverters.js";

import { isValidUrl }
  from "./functions/isValidUrl.js";

import { checkMetadata }
  from "./functions/checkMetadata.js";


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

app.use(
  express.json({
    limit: "50mb",
  })
);
 const swaggerSpec =
  swaggerJsdoc({

    definition: {

      openapi: "3.0.0",

      info: {

        title:
          "FRAME (FAIR Review and Metadata Evaluation Engine)",

        version: "1.0.0",

        description:
          "FRAME is a web-based tool to assess the quality and completeness of metadata based on FAIR principles.",
      },

      servers: [
        {
          url:
            "http://localhost:3006",
        },
      ],
    },

    apis: ["./server.js"],
  });


app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

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
              "url parameter required",
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
        contentType.includes("json")
      ) {

        raw =
          await response.json();


        if (
          raw?.metadata?.creators
        ) {

          raw =
            convertZenodo(raw);
        }

      }
 else {

        const text =
          await response.text();


        const parser =
          new XMLParser({
            ignoreAttributes: false,
          });


        const parsed =
          parser.parse(text);


        if (
          parsed["eml:eml"]
        ) {

          raw =
            convertArcticXML(
              parsed["eml:eml"]
            );

        } else {

          raw = parsed;
        }
      }
 const assessment =
        await checkMetadata(
          raw,
          rules
        );


      res.json({
        success: true,
        assessment,
      });

    }

    catch (err) {

      res
        .status(500)
        .json({
          success: false,
          error: err.message,
        });
    }
  }
);
 app.post(
  "/api/assess-dev",

  async (req, res) => {

    try {

      let raw =
        req.body;


      if (
        !raw ||
        Object.keys(raw).length === 0
      ) {

        return res
          .status(400)
          .json({
            success: false,
            error:
              "JSON body is required",
          });
      }
 if (
        raw?.metadata?.creators
      ) {

        raw =
          convertZenodo(raw);
      }
       
 const assessment =
        await checkMetadata(
          raw,
          rules
        );

        

      res.json({
        assessment,
      });

    }

    catch (err) {

      res
        .status(500)
        .json({
          success: false,
          error: err.message,
        });
    }
  }
);
 app.get(
  "/api/check-url",

  async (req, res) => {

    try {

      const {
        url,
        title,
      } = req.query;


      if (!url || !title) {

        return res
          .status(400)
          .json({
            success: false,
            error:
              "url and title are required",
          });
      }


      const result =
        await isValidUrl(
          url,
          title
        );


      res.json({
        success: true,
        ...result,
      });

    }

    catch (err) {

      res
        .status(500)
        .json({
          success: false,
          error: err.message,
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