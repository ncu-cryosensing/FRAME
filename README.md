# TaiPI Metadata Assessment

The Metadata Assessment Tool is a web-based application designed to evaluate the completeness and quality of metadata records against predefined validation criteria.
The tool supports dynamic configuration using JSON, allowing users to easily customize validation rules without modifying the application source code.

By externalizing validation logic into JSON files, the system becomes:

- flexible
- easily maintainable
- adaptable to different metadata standards
- scalable for new validation requirements

## Features

-   **URL-based fetch** of JSON or XML (`application/json`,
    `application/xml`, `text/xml`, or JSON served as `text/plain`)
-   **Robust XML → JSON** conversion using `fast-xml-parser`
-   **FAIR checks** with per-principle tallies and overall counts
-   **Visual summary** via `SummaryChart` and per-principle progress
    sections
-   **Tabbed checklists** (Passed, Failed, Warnings, Info)


## Core Logic

The main logic lives in `checkMetadata(md)`, which inspects a metadata
object and produces:

``` ts
{
  totalChecks: number,
  totalScores: { Findable: number, Accessible: number, Interoperable: number, Reusable: number },
  passed: number,
  warnings: number,
  failed: number,
  informational: number,
  passedScores: { Findable: number, Accessible: number, Interoperable: number, Reusable: number },
  passedChecks: Array<{ message, level, principle }>,
  warningChecks: Array<{ message, level, principle }>,
  failedChecks: Array<{ message, level, principle }>,
  informationalCheck: Array<{ message, level, principle }>
}
```

Checks currently include (examples):

-   Title word count\
-   Presence of identifiers (`metadataIdentifier`, `doi`)\
-   Authors array (name, ORCID, affiliation expected)\
-   `publicationDate`\
-   `short_description` and `documentation` word counts\
-   Spatial extent, landing page, download URL, API URL, dataset
    license\
-   Optional integrations like Interactive Map / TaiPIHub

> You can easily add or adjust checks inside `checkMetadata(md)`.
# Usage

Before running this project, make sure the following software is installed:

- **Node.js 16 or later**
- **npm** (included with Node.js) or **yarn**
## Configure AI API Key
Get an API key from OpenRouter:

https://openrouter.ai/keys

Create a `.env` file in the project root and add your AI API key:

```env
REACT_APP_OPENROUTER_API_KEY=your_api_key
```

Replace `your_api_key` with your actual API key.
## Option 1: Run with Docker

```bash
docker run -it -p 3000:3000 taipidata/metadata_assessment start
```

Open http://localhost:3000 in your browser.

## Option 2: Run from Source

### Clone the Repository

```bash
git clone https://github.com/ncu-cryosensing/metadata-assessment.git
cd metadata_assessment
```

### Install Dependencies

```bash
npm install
```

### Start the Development Server

```bash
npm run start
```

Open http://localhost:3000 in your browser.

### Build for Production

```bash
npm run build
```


