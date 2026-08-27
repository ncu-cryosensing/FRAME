import fetch from "node-fetch";

export async function evaluateAIQuality(md) {
  try {
      
    const dbResponse = await fetch(
      `http://127.0.0.1:3005/records/${md.id}`
    );

    if (dbResponse.ok) {
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
 const model = process.env.MODEL || "ag/gemini-3.7-flash-high";
      
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
Evaluate readability and informativeness.

Short Description:
${md.short_description || ""}

Documentation:
${md.documentation || ""}

Whether the host repository that is indexed by search engine?
${md.url_page || ""}

documentation is provided using a language with a formal specification?
${md.documentation || ""}

whether the description/documentation contains any references?
${md.documentation || ""}

Whether the repository / data set retrieval needs authorization before access?
${md.url_page || ""}

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
        `http://127.0.0.1:3005/records/${md.id}`,
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
            ai_doc_language: aiResult.index_page,
            a_doc_references: aiResult.index_page,
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
      error
    );

    return {
      short_description: null,
      documentation: null,
    };
  }
}