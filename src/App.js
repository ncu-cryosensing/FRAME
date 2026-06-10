import './App.css';
import React, { useEffect, useState, useRef } from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap';
import SummaryChart from './components/SummaryChart';
import AssessmentSection from './components/AssessmentSection';
import CheckList from './components/CheckList';
import { XMLParser } from 'fast-xml-parser';
import { convertZenodo }from './zenodoConverters';
import { convertDataverse }from './dataverseConverters';
import { convertArcticXML }from './arcticConverters';
import { Navbar, Nav } from "react-bootstrap";
import { GoogleGenAI } from "@google/genai";

function App({ setPage }) {

  const [data, setData] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
    
    
  // -------------------
  // load FAIR rules
  // -------------------
  const [rules, setRules] = useState(null);

  useEffect(() => {
    fetch("/fair_checks.json")
      .then(res => res.json())
      .then(data => setRules(data));
  }, []);

  // -------------------
  // helper functions
  // -------------------

  function countWords(text) {
    return text?.split(/\s+/).filter(Boolean).length || 0;
  }

  function replaceTemplate(msg, context) {

  return msg
    .replace("{count}", context.count ?? "")
    .replace("{value}", context.value ?? "")
    .replace("{min}", context.min ?? "")
    .replace("{aiResult1}", context.aiResult1 ?? "")
    .replace("{aiResult2}", context.aiResult2 ?? "");

}
async function evaluateAIQuality(md) {

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-site.com", // optional
        "X-Title": "Metadata Assessment" // optional
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

if (response.status === 429) {

  return {

    short_description:
      null,

    documentation:
      null

  };

}

  const data = await response.json();

  const text = data.choices[0].message.content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text);
}

  async function evaluateRule(md, rule, aiQuality) {

    let value = md[rule.field];
    let count = 0;
    let condition = false;
    let aiResult1 = null;
    let aiResult2 = null;

    switch (rule.type) {

      case "exists":
        condition = !!value;
        break;

      case "wordCount":
        count = countWords(value);
        condition = count >= rule.min;
        break;

      case "arrayNotEmpty":
        condition =
          Array.isArray(value) &&
          value.length > 0;
        break;
      case "aiQuality1":

      if (!value) {

        condition = false;

        aiResult1 = "Short description is not present"}
          
    else if (!aiQuality.short_description) {

        condition = false;

        aiResult1 = "AI failed to assess Short Description"

      } else {
          condition =  (aiQuality.short_description!="Poor");
           aiResult1 = "Readability and informativeness for Short Description is " + aiQuality?.short_description;
      }
        break;
    case "aiQuality2":

      if (!value) {

        condition = false;

        aiResult2 = "Documentation is not present";

      } 
      
       else if (!aiQuality.documentation) {

        condition = false;

        aiResult2 = "AI failed to assess Documentation"

      }
      else {
          condition = (aiQuality.documentation!="Poor");
           aiResult2 = "Readability and informativeness for Documentation is " + aiQuality?.documentation;
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

  // -------------------
  // AI QUALITY
  // -------------------

  const aiQuality =
  await evaluateAIQuality(md);
  console.log(aiQuality);



  // -------------------
  // RESULT OBJECT
  // -------------------

  const result = {

    totalChecks: 0,

    totalScores: {
      Findable: 0,
      Accessible: 0,
      Interoperable: 0,
      Reusable: 0
    },

    passed: 0,
    warnings: 0,
    failed: 0,
    informational: 0,

    passedScores: {
      Findable: 0,
      Accessible: 0,
      Interoperable: 0,
      Reusable: 0
    },

    passedChecks: [],
    warningChecks: [],
    failedChecks: [],
    informationalCheck: []

  };



  // -------------------
  // ADD RESULT
  // -------------------

  function addResult(
    condition,
    successMsg,
    failureMsg,
    level,
    principle
  ) {

    result.totalChecks++;

    result.totalScores[principle]++;

    if (condition) {

      result.passed++;

      result.passedScores[principle]++;

      result.passedChecks.push({

        message: successMsg,
        level,
        principle

      });

    }
    else {

      if (level === "REQUIRED") {

        result.failed++;

        result.failedChecks.push({

          message: failureMsg,
          level,
          principle

        });

      }
      else {

        result.warnings++;

        result.warningChecks.push({

          message: failureMsg,
          level,
          principle

        });

      }

    }

  }



  // -------------------
  // NORMAL RULES
  // -------------------

  for (const rule of rules.checks) {

    const { condition, context } =
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



  


  // -------------------
  // INFO RULES
  // -------------------

  for (const rule of rules.info) {

    const { condition } =
      await evaluateRule(
        md,
        rule,
        aiQuality
      );

    if (condition) {

      result.informational++;

      result.informationalCheck.push({

        message:
          replaceTemplate(
            rule.message,
            {
              value:
                md?.[rule.field] ||
                "dataset"
            }
          ),

        level: "INFO",

        principle:
          rule.principle

      });

    }

  }



  return result;
}
  // -------------------
  // process metadata
  // -------------------
  async function processMetadata(raw) {

  const md =
    Array.isArray(raw)
      ? raw[0]
      : raw;

  setDataset(md);

  const result =
    await checkMetadata(md);
  setData(result);
}

  // -------------------
  // fetch from URL
  // -------------------
  const handleFetch = async (e) => {

    e.preventDefault();

    if (!url.trim()) {
      setError('Enter URL or upload file');
      return;
    }

    setError('');
    setLoading(true);
    setData(null);

    try {

      const res = await fetch(url, {
        headers: {
          Accept:
            'application/json, application/xml, text/xml'
        }
      });

      if (!res.ok)
        throw new Error(`HTTP ${res.status}`);

      const ct =
        (res.headers.get('content-type') || '').toLowerCase();

      let raw;

      if (ct.includes('json')) {

  raw = await res.json();

  
  if (raw?.metadataGeneratedBy) {

    raw = raw;

  }

  // Zenodo
  else if (raw?.metadata?.creators) {

    raw = convertZenodo(raw);

  }

  // Dataverse
  else if (
    raw?.data?.latestVersion?.metadataBlocks
  ) {

    raw = convertDataverse(raw);

  }

 
  else {

  throw new Error('JSON_NOT_SUPPORTED');

}



      }
      else if (ct.includes('xml') || url.endsWith('.xml')) {

        const text = await res.text();

        const xmlDoc =
          new DOMParser()
            .parseFromString(text, 'application/xml');

        const parserError =
          xmlDoc.getElementsByTagName('parsererror')[0];

        if (parserError)
          throw new Error('Invalid XML');

        const fxp = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_'
        });

        let jsonObj = fxp.parse(text);

        delete jsonObj["?xml"];
       
  if (jsonObj["eml:eml"]?.dataset) {

    raw =
      convertArcticXML(jsonObj["eml:eml"]);

    

  }

 
  else if (jsonObj?.dataset?.authors) {

    jsonObj.dataset.authors =
      jsonObj.dataset.authors.author;

    raw =
      jsonObj.dataset;
      

  }

  
  else {

    raw =
      jsonObj;
     

  }

}
      else {

        const txt = await res.text();
        raw = JSON.parse(txt);

      }

     await processMetadata(raw);

    }
    catch (err) {

      setError(err.message);

    }
    finally {

      setLoading(false);

    }

  };

  // -------------------
  // upload file
  // -------------------
  const handleFileUpload = async (e) => {

   const file = e.target.files[0];

  if (!file) return;

  setSelectedFile(file);

  // clear URL input
  setUrl('');

  setError('');
  setLoading(true);


    try {

      const text = await file.text();

      let raw;

      if (file.name.endsWith('.json')) {

        raw = JSON.parse(text);
        if (raw?.metadataGeneratedBy) {

    raw = raw;

  }

  // Zenodo
  else if (raw?.metadata?.creators) {

    raw = convertZenodo(raw);

  }

  // Dataverse
  else if (
    raw?.data?.latestVersion?.metadataBlocks
  ) {

    raw = convertDataverse(raw);

  }

 
  else {

  throw new Error('JSON_NOT_SUPPORTED');

}



      }
 
     else if (file.name.endsWith('.xml')) {

  const xmlDoc =
    new DOMParser()
      .parseFromString(text, 'application/xml');

  const parserError =
    xmlDoc.getElementsByTagName('parsererror')[0];

  if (parserError)
    throw new Error('Invalid XML');

  const fxp =
    new XMLParser({

      ignoreAttributes: false,
      attributeNamePrefix: '@_'

    });

  let jsonObj =
    fxp.parse(text);

  delete jsonObj["?xml"];
 
  // -------------------
  // Arctic EML
  // -------------------
  if (jsonObj["eml:eml"]?.dataset) {

    raw =
      convertArcticXML(jsonObj["eml:eml"]);

    

  }

  // -------------------
  // TaiPI XML
  // -------------------
  else if (jsonObj?.dataset?.authors) {

    jsonObj.dataset.authors =
      jsonObj.dataset.authors.author;

    raw =
      jsonObj.dataset;
      

  }

  // -------------------
  // generic XML fallback
  // -------------------
  else {

    raw =
      jsonObj;
      

  }

}
    
      else {

        throw new Error('Only JSON or XML supported');

      }

     await processMetadata(raw);

    }
    catch (err) {

      setError(err.message);

    }
    finally {

      setLoading(false);

    }

  };


  const formatDate = (isoString) => {

    const d = new Date(isoString);

    return isNaN(d)
      ? 'Unknown'
      : d.getFullYear();

  };


useEffect(() => {

  if (url && fileInputRef.current) {

    fileInputRef.current.value = '';

    setSelectedFile(null);

  }

}, [url]);

   

  return (

    <Container className="mt-4">



     

      {/* clickable example */}
      <p className="mb-3">

        Example:

        <button

          onClick={() => {

          setUrl(process.env.PUBLIC_URL + 'dummy-metadata.json');

            setTimeout(() => {

              document
                .querySelector('form')
                .requestSubmit();

            }, 100);

          }}

          className="text-blue-600 underline ml-2"

        >
          /dummy-metadata.json,

        </button>

              <button
  onClick={() => {setUrl('https://zenodo.org/api/records/13629087')
                 setTimeout(() => {

              document
                .querySelector('form')
                .requestSubmit();

            }, 100);
                 }}
    
  className="text-blue-600 underline ml-3"
>
Zenodo,
</button>

<button
  onClick={() => {setUrl('https://dataverse.harvard.edu/api/datasets/:persistentId?persistentId=doi:10.7910/DVN/TJCLKP')
                 setTimeout(() => {

              document
                .querySelector('form')
                .requestSubmit();

            }, 100);
                 
                 }}
  className="text-blue-600 underline ml-3"
>
Dataverse,
</button>

<button
  onClick={() => {setUrl('https://arcticdata.io/metacat/d1/mn/v2/object/doi%3A10.18739%2FA2RX93F75')
                 setTimeout(() => {

              document
                .querySelector('form')
                .requestSubmit();

            }, 100);
                 
                 }}
  className="text-blue-600 underline ml-3"
>
arcticdata.io,
</button>
        <button

          onClick={() => {

          setUrl(process.env.PUBLIC_URL + '/dummy-metadata3.json');

            setTimeout(() => {

              document
                .querySelector('form')
                .requestSubmit();

            }, 100);

          }}

          className="text-blue-600 underline ml-2"

        >
          /dummy-metadata-2.json

        </button>

      </p>

      <form
        onSubmit={handleFetch}
        className="flex flex-col gap-3 mb-4"
      >

       <input
  type="text"
  placeholder="Enter JSON URL"
  value={url}
  onChange={(e) => setUrl(e.target.value)}
  className="border p-2"
/>
        <input
  ref={fileInputRef}
  type="file"
  accept=".json,.xml"
  onChange={handleFileUpload}
  className="border p-2"
/>

        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded"
        >

          {loading
            ? "Assessing..."
            : "Assess"}

        </button>

      </form>

      {error && (
  <div className="text-red-600">
    <p>
      {error === 'JSON_NOT_SUPPORTED'
        ? 'JSON not supported format.'
        : error}
    </p>

    {error === 'JSON_NOT_SUPPORTED' && (
      <button
        onClick={() => setPage("generate")}
        className="mt-2 text-blue-600 underline"
      >
        Go to Generate JSON
      </button>
    )}
  </div>
)}

      {
        data && !error &&
        dataset &&
        (() => {

          const authorsText =
  (dataset.authors
    ?.map(a => a.name)
    .join('; ') || 'Unknown') + ';';

          return (

            <>

              <p>

                <strong>
                  Dataset Title: 
                </strong> &nbsp;

                {dataset.title
                  || 'Untitled'}

              </p>

              <p>

                <strong>
                  Authors: 
                </strong> &nbsp;

                {authorsText}

              </p>

              <p>

                <strong>
                  Year:
                </strong> &nbsp;

                {formatDate(
                  dataset.publicationDate
                )}

              </p>

              <div className="flex flex-col md:flex-row">

                <div className="mr-5">

                  <SummaryChart
                    passed={data.passed}
                    warnings={data.warnings}
                    failed={data.failed}
                    information={data.informational}
                    total={data.totalChecks}
                  />

                </div>

                <div className="w-full">

                  {
                    Object.entries(
                      data.passedScores
                    ).map(
                      ([key, val]) => {

                        const total =
                          data.totalScores[key] || 1;

                        return (

                          <AssessmentSection
                            key={key}
                            title={key}
                            value={
                              (val / total) * 100
                            }
                          />

                        );

                      })
                  }

                </div>

              </div>

              <Tabs
                defaultActiveKey="passed"
                className="mt-4"
                fill
              >

                <Tab
                  eventKey="passed"
                  title={`Passed ${data.passed}`}
                >

                  <CheckList
                    items={data.passedChecks}
                    color="#4CAF50"
                  />

                </Tab>

                <Tab
                  eventKey="failed"
                  title={`Failed ${data.failed}`}
                >

                  <CheckList
                    items={data.failedChecks}
                    color="#F44336"
                  />

                </Tab>

                <Tab
                  eventKey="warnings"
                  title={`Warnings ${data.warnings}`}
                >

                  <CheckList
                    items={data.warningChecks}
                    color="#FFC107"
                  />

                </Tab>

                <Tab
                  eventKey="info"
                  title={`Info ${data.informational}`}
                >

                  <CheckList
                    items={data.informationalCheck}
                    color="#2196F3"
                  />

                </Tab>

              </Tabs>

            </>

          );

        })()
      }

    </Container>

  );

}

export default App;
