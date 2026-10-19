# Running FRAME

## Using the Graphical Interface (GUI)
This section walks you through assessing a dataset's metadata using the FRAME GUI at `http://localhost:3000`.

### Landing page


```{figure} ../_figures/GUI.svg
:alt: FRAME report
:width: 100%

FRAME landing page
```

Our landing page lets you specify a metadata record to be checked. You can also click any link above the input field for an example metadata record. To use:

1. **Enter the metadata URL** in the input field. The URL can be:

- A direct link to a **JSON** metadata file, e.g. `https://taipidata.ncu.edu.tw/frame/dummy-metadata.json`
- A link to an **XML** file (e.g. EML from the Arctic Data Center)
- A **Zenodo** or **Dataverse** record URL. The FRAME tool will retrieve the corresponding metadata record.

2. Or, **upload a metadata file** from your computer using the *Choose file* button if the metadata is not available online.

3. **Click the *Assess* button** and wait for the assessment to finish. FRAME will access the metadata, reformat it (if needed), run all FAIR checks, and display the report. A *loading* indicator (spinner) is shown while the process runs.


```{note}
Regarding the AI assessments: To conserve tokens, FRAME includes a database to store previous AI assessments. New AI assessments will only be performed when the metadata entry is new or has been modified. Otherwise, FRAME reuses the cached assessment results.
```

### Assessment report

```{figure} ../_figures/FRAME-report.svg
:alt: FRAME report
:width: 100%

An example metadata assessment report produced by FRAME.
```

The assessment report consists of several parts:

- **Summary Chart** — a chart summarizing the FAIR scores (percentage of passed checks) per principle (Findable, Accessible, Interoperable, Reusable). The pie chart shows the number of checks with a binary (pass/fail) status with a color code: <p style="color: green">passed checks</p>, <p style="color: yellow">failed optional checks (warnings)</p>, and <p style="color: red">failed mandatory checks</p>.
- **Tabbed CheckList** — the list of all checks with their assessment messages, grouped into four tabs:
  - *Passed*
  - *Failed* (failed mandatory checks)
  - *Warnings* (failed optional checks)
  - *Info* (other qualitative checks)

### Workflow summary

```{figure} ../_figures/gui-workflow.svg
:alt: FRAME report
:width: 100%

Four steps to assess metadata through the FRAME GUI.
```


## Using the FRAME API

The FRAME API is designed for **developers and data repository administrators** who want to integrate FRAME into their own systems. Instead of using the built-in GUI, the API accepts a JSON metadata record and returns the assessment report in JSON as well.

### Interactive API documentation (Swagger UI)

Once the server is running, open the interactive API documentation at:

```
http://localhost:3006/api/docs
```

This Swagger UI page lists all endpoints and includes a *Try it out* button so you can test the API directly from your browser.

```{figure} ../_figures/FRAME-swagger.svg
:alt: FRAME report
:width: 100%

the FRAME API Swagger UI documentation on port 3006.
```


### Assessing metadata via URL (GET /api/assess)

The simplest way is to pass a `url` query parameter pointing to the metadata file:

```
curl "http://localhost:3006/api/assess?url=https://taipidata.ncu.edu.tw/frame/dummy-metadata.json"
```

The response structure is shown here as an example:

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

```{note}
The entry numbers in the example response are for demonstration. The actual number of check entries follows the `core/rules.json` file in the version you are running.
```

### Assessing metadata via a JSON body (POST /api/assess-dev)

This endpoint takes the metadata JSON directly from the request body, which is ideal for properly formatted metadata. This endpoint also supports a forced AI reassessment regardless of whether the metadata record has been modified:

```
curl -X POST "http://localhost:3006/api/assess-dev?reassess=false" \
  -H "Content-Type: application/json" \
  -d @metadata.json
```

- `reassess=false` (default): cached AI assessment results are reused.
- `reassess=true`: forces AI to evaluate the record.