# Running FRAME

## Using the Graphical Interface (GUI)
This section walks you through assessing a dataset's metadata using the FRAME GUI at `http://localhost:3000`.

### The landing page: entering metadata


```{figure} ../_figures/GUI.svg
:alt: FRAME report
:width: 100%

FRAME landing page
```



1. **Enter the metadata URL** in the input field. The URL can be:

- A direct link to a **JSON** metadata file, e.g. `https://taipidata.ncu.edu.tw/frame/dummy-metadata.json`
- A link to an **XML** file (e.g. EML from the Arctic Data Center)
- A **Zenodo** or **Dataverse** record URL — converted automatically



2. **Or upload a metadata file** from your computer using the *Choose file* button, if the metadata is not available online.



3. **Click the *Assess* button** and wait for the assessment to finish. FRAME will download the metadata, convert it if needed, run all FAIR checks, and display the report. A *loading* indicator (spinner) is shown while the process runs.



```
AI assessment. If an AI assessment result for this metadata is already stored
(cached), FRAME will reuse it. 
```


### The assessment report

```{figure} ../_figures/FRAME-report.svg
:alt: FRAME report
:width: 100%

An example metadata assessment report produced by FRAME.
```

The assessment report consists of several parts:

- **Summary Chart** — a chart summarizing the FAIR scores per principle (Findable, Accessible, Interoperable, Reusable) along with the number of checks that <span style="color:var(--green);font-weight:600">passed</span>, <span style="color:var(--yellow);font-weight:600">warned</span>, or <span style="color:var(--red);font-weight:600">failed</span>.
- **Assessment Section** — detailed scores and progress per FAIR principle.
- **Tabbed CheckList** — the list of all checks with their explanatory messages, grouped into the *Passed*, *Failed*, *Warnings*, and *Info* tabs.

### GUI workflow summary

```{figure} ../_figures/gui-workflow.svg
:alt: FRAME report
:width: 100%

Four steps to assess metadata through the FRAME GUI.
```


### Using the FRAME API

The FRAME API is designed for **developers and data repository administrators** who want to integrate FRAME into their own systems. Instead of using the built-in GUI, the API accepts a JSON metadata record and returns the assessment report as JSON.

### Interactive API documentation (Swagger UI)

Once the server is running, open the interactive API documentation at:

    http://localhost:3006/api/docs

This Swagger UI page lists all endpoints and includes a *Try it out* button so you can test the API directly from your browser.

```{figure} ../_figures/FRAME-swagger.svg
:alt: FRAME report
:width: 100%

the FRAME API Swagger UI documentation on port 3006.
```


### Assessing metadata via URL (GET /api/assess)

The simplest way — pass a `url` query parameter pointing to the metadata file:

```
curl "http://localhost:3006/api/assess?url=https://taipidata.ncu.edu.tw/frame/dummy-metadata.json"
```

Example response structure:

    {
      "success": true,
      "assessment": {
        "totalChecks": 25,
        "totalScores": {
          "Findable": 11, "Accessible": 4,
          "Interoperable": 2, "Reusable": 8
        },
        "passed": 20, "warnings": 1, "failed": 4,
        "passedScores": { "Findable": 10, "Accessible": 3, "Interoperable": 1, "Reusable": 6 },
        "passedChecks": [ { "message": "A DOI is present: ...", "level": "REQUIRED", "principle": "Findable" } ],
        "failedChecks": [ { "message": "No contributor has associated their ORCID ...", "level": "REQUIRED", "principle": "Findable" } ],
        "warningChecks": [], "informationalCheck": []
      }
    }


 **Note:** the numbers in the example response are illustrative; the actual number of checks follows the `core/rules.json` file in the version you are running.



### Assessing metadata via a JSON body (POST /api/assess-dev)

This endpoint takes the metadata JSON directly from the request body — ideal for metadata you have converted yourself — and supports the AI result cache:

```
curl -X POST "http://localhost:3006/api/assess-dev?reassess=false" \
  -H "Content-Type: application/json" \
  -d @metadata.json
```

- `reassess=false` (default): cached AI assessment results are reused.
- `reassess=true`: force the AI checks to be evaluated again.