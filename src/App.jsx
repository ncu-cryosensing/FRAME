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

function App({ setPage }) {

  const [data, setData] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
    
    
  
  async function processMetadata(raw) {

   const response2 = await fetch("http://localhost:3006/api/assess-dev", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(raw)
});

const result = await response2.json();



  const md =
    Array.isArray(raw)
      ? raw[0]
      : raw;

  setDataset(md);
      
  

  setData(result.assessment);
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

  
  

  // Zenodo
  if (raw?.metadata?.creators) {

    raw = convertZenodo(raw);

  }

  // Dataverse
  else if (
    raw?.data?.latestVersion?.metadataBlocks
  ) {

    raw = convertDataverse(raw);

  }

 
  else {

  raw=raw

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


  // Zenodo
  if (raw?.metadata?.creators) {

    raw = convertZenodo(raw);

  }

  // Dataverse
  else if (
    raw?.data?.latestVersion?.metadataBlocks
  ) {

    raw = convertDataverse(raw);

  }

 
  else {

  raw=raw

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

          setUrl('dummy-metadata.json');

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

          setUrl('fair-metadata.json');

            setTimeout(() => {

              document
                .querySelector('form')
                .requestSubmit();

            }, 100);

          }}

          className="text-blue-600 underline ml-2"

        >
          fair-metadata.json,

        </button>
<button

          onClick={() => {

          setUrl('poor-metadata.json');

            setTimeout(() => {

              document
                .querySelector('form')
                .requestSubmit();

            }, 100);

          }}

          className="text-blue-600 underline ml-2"

        >
          poor-metadata.json

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
  <strong>Dataset Title:</strong>&nbsp;
  {url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none"}}
    >
      {dataset.title || "Untitled"}
    </a>
  ) : (
    dataset.title || "Untitled"
  )}
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
               

{data.passed < 4 && (
  <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3">
    <p className="text-sm font-medium text-red-700">
      Your metadata has fewer than 4 passed checks. Please generate the metadata again using the required format.
    </p>

    <button
      onClick={() => setPage("generate")}
      className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
    >
      Go to Generate JSON
    </button>
  </div>
)}

            </>

          );

        })()
      }

    </Container>

  );

}

export default App;
