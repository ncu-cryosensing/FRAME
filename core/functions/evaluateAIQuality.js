import fetch from "node-fetch";

export async function hasCachedAiResult(md) {
  try {

    const dbResponse = await fetch(
      `http://127.0.0.1:3005/records/${encodeURIComponent(md.id)}`
    );

    if (dbResponse.ok) {
      const data_base = await dbResponse.json();

      return !!(
        data_base &&
        data_base.short_description === md.short_description &&
        data_base.documentation === md.documentation &&
        data_base.ai_result_short_description != null
      );
    }

  } catch (error) {
    // database unreachable -> treat as no cached result
  }

  return false;
}

export async function evaluateAIQuality(md, reAssess = false) {
  try {
      
    const dbResponse = await fetch(
      `http://127.0.0.1:3005/records/${encodeURIComponent(md.id)}`
    );

    if (dbResponse.ok && !reAssess) {
      const data_base = await dbResponse.json();

      if (
        data_base &&
        data_base.short_description === md.short_description &&
        data_base.documentation === md.documentation &&
        data_base.ai_result_short_description != null
      ) {
        return {
          short_description:
            data_base.ai_result_short_description,

          documentation:
            data_base.ai_result_documentation,

        index_page: data_base.ai_index_page,
        doc_language:  data_base.ai_doc_language,
        doc_references:  data_base.ai_doc_references,
        data_retrieval: data_base.ai_data_retrieval ,
        retrieval_protocol: data_base.ai_retrieval_protocol
        };
      }
    }

 const apiEndpoint = process.env.ENDPOINT || "https://taipidata.ncu.edu.tw/ai/v1/chat/completions";
 const model = process.env.MODEL || "free-ai";
      
 const response = await fetch(
      apiEndpoint,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${process.env.API_KEY}`,
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          model: model,
          stream: false,

          messages: [
            {
              role: "user",

              content: `
Evaluate only the metadata descriptions. Do not assess the quality of the dataset itself. Classify each field independently as Poor, Fair, or Good based on how effectively it describes the dataset.

1. Short Description

Evaluate the short description according to its purpose as a concise summary of the dataset. Do not expect the level of detail or completeness required in full documentation.

Poor
The description is missing, incomprehensible, or so vague or generic that users cannot identify what the dataset actually contains. It may mention only a broad topic without providing meaningful information about the dataset. 

Fair
The description identifies the general subject or contents of the dataset but provides limited specificity or context. Users can obtain a basic idea of the dataset, but some ambiguity remains about its actual contents, purpose, or scope.

Good
The description is concise, clear, and sufficiently specific to help users understand what the dataset contains or represents. It provides meaningful information about the dataset's subject, purpose, key contents, or distinguishing characteristics, as appropriate. It does not need to include every detail, methodology, spatial or temporal coverage, or usage instruction if these are better suited to the documentation.

Important rules for short descriptions:

Brevity is expected and must not be penalized by itself.

Do not require the short description to explain all dataset details.

If the short description contains fewer than 20 words, classify it as Poor, regardless of its informativeness.

If the short description contains 20 words or more, evaluate it using the Poor, Fair, and Good criteria above.

A concise description can be Good if it clearly and specifically communicates the dataset's main contents.

Classify based on informativeness and specificity, not word count alone.

2. Documentation

Evaluate the documentation according to how effectively it explains the dataset and helps users understand or use it.

Poor
The documentation is missing, extremely brief, vague, or overly generic. It provides insufficient information to understand the dataset. Important relevant details, such as contents, context, spatial or temporal coverage, methodology, or usage instructions, are largely missing.

Fair
The documentation provides meaningful information about the dataset but leaves notable gaps in context, explanation, interpretation, or practical usage. It may describe the dataset and refer to external publications or resources without sufficiently explaining important aspects within the documentation itself. It is generally understandable but offers limited guidance for users who want to interpret or use the data.

Good
The documentation is clear, specific, and informative. It adequately explains the dataset's purpose, contents, context, and relevant characteristics. Where applicable, it includes details such as spatial or temporal coverage, methodology, file contents, processing procedures, or usage instructions that enable users to understand and appropriately use the dataset.

Important rules for documentation:

Evaluate completeness relative to the dataset's nature and complexity.

Do not require information that is irrelevant or inapplicable.

Do not reward length alone; evaluate the actual information provided.

Do not automatically assign a rating based only on word count.

Input

Short Description:
${md.short_description || ""}

Documentation:
${md.documentation || ""}

Is the host repository indexed by search engines?
${md.url_page || ""}

Does the documentation use a language with a formal specification?
no documentation return false

Does the description/documentation contain any scientific references or citations?
no documentation return false

Does access to download dataset require authorization?
${md.url_download || ""}

What the dataset retrieval protocol ?
${md.url_page || ""}
Return ONLY valid JSON:

{
  "short_description": "Poor | Fair | Good",
  "documentation": "Poor | Fair | Good",
  "index_page": "true | false",
  "doc_language": "true | false",
  "doc_references": "true | false",
  "data_retrieval": "true | false",
  "retrieval_protocol": "list the protocol"
}
`,
            },
          ],
        }),
      }
    );

    if (
      response.status === 401 ||
      response.status === 429
    ) {
      return {
        short_description: null,
        documentation: null,
      };
    }

    const data = await response.json();
    
    const content =
      data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI response is empty");
    }

    const cleanContent = content
      .replace(/```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const aiResult = JSON.parse(cleanContent);

    if (dbResponse.status === 404) {
      await fetch(
        "http://127.0.0.1:3005/records",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id_metadata: md.id,

            ai_result_short_description:
              aiResult.short_description,

            ai_result_documentation:
              aiResult.documentation,

            ai_index_page:  aiResult.index_page,
            ai_doc_language: aiResult.doc_language ,
            ai_doc_references: aiResult.doc_references ,
            ai_data_retrieval: aiResult.data_retrieval,
            ai_retrieval_protocol: aiResult.retrieval_protocol ,

            short_description:
              md.short_description,

            documentation:
              md.documentation,
          }),
        }
      );
    } else if (dbResponse.ok) {
      await fetch(
        `http://127.0.0.1:3005/records/${encodeURIComponent(md.id)}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id_metadata: md.id,

            ai_result_short_description:
              aiResult.short_description,

            ai_result_documentation:
              aiResult.documentation,

            ai_index_page:  aiResult.index_page,
            ai_doc_language: aiResult.doc_language,
            ai_doc_references: aiResult.doc_references,
            ai_data_retrieval: aiResult.data_retrieval ,
            ai_retrieval_protocol: aiResult.retrieval_protocol ,

            short_description:
              md.short_description,

            documentation:
              md.documentation,
          }),
        }
      );
    } else {
      throw new Error(
        `Database request failed: ${dbResponse.status}`
      );
    }

    return aiResult;
  } catch (error) {
    console.error(
      "AI quality evaluation failed:",
      error.message
    );

    return {
      short_description: null,
      documentation: null,
    };
  }
}