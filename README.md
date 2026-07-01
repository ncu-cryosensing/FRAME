# FRAME

FRAME (**FAIR Review and Metadata Evaluation Engine**) is a web-based tool to assess the quality and completeness of the metadata for a given dataset based on the FAIR (Findable, Accessible, Interoperable, and Reusable) principles. With predefined criteria, FRAME accesses the metadata via a URL, reviews the content, validates its FAIRness, and finally provides quality scores for the metadata. This tool is designed for researchers and dataset administrators who need to host or use open datasets, as it provides a common basis for communication about data sharing, an important component of open science. 

## How it works

FRAME reads a metadata record formatted in JSON (JavaScript Object Notation). This tool then performs multiple checks defined in `fair_checks.json`. Finally, FRAME displays the status of each check and a summary report for further inspection. Here are some examples of the checks performed by FRAME:

<!-- The main logic lives in `checkMetadata(md)`, which inspects a metadata
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
``` -->

-   Dataset title length
-   Presence of DOI (Digital Object Identifier)
-   Author information, such as names, ORCIDs, and affiliations
-   Date of publication
-   Quality of description, readme, and documentation file(s)
-   Public landing page
-   Data access URLs, including direct downloads and API access
-   License
-   Spatial extent (spatial data only)
-   Cloud-based integrations, such as an online visualization portal or JupyterHub

<!-- > You can easily add or adjust checks inside `checkMetadata(md)`. -->

## Features

-   **URL-based fetch** of JSON or XML (`application/json`,
    `application/xml`, `text/xml`, or JSON served as `text/plain`)
-   **Robust XML → JSON** conversion using `fast-xml-parser`
-   **FAIR checks** with per-principle tallies and overall counts
-   **Visual summary** via `SummaryChart` and per-principle progress
    sections
-   **Tabbed checklists** (Passed, Failed, Warnings, Info)

<!-- The tool supports dynamic configuration using JSON, allowing users to easily customize validation rules without modifying the application source code. -->

<!-- By externalizing validation logic into JSON files, the system becomes flexible, easily maintainable, adaptable to different metadata standards, and scalable for new validation requirements. -->


# Usage
### Which option should I choose?

FRAME can be used in three different ways depending on your needs. 
Option 1 (Docker) is the easiest way to get started because it requires only a single command and no manual installation of Node.js or project dependencies. It is recommended for users who simply want to run FRAME with minimal setup. The trade-off is that modifying the application source code requires entering the Docker container and rebuilding or committing a new image.

Option 2 (Run from Source) is intended for users who want to customize or extend FRAME. This option requires installing Node.js, npm, and the project dependencies, but it provides direct access to the source code. Changes to the UI, validation logic, or other application components can be made and tested immediately during development.

Option 3 (API Service) is designed for developers and data repository administrators who want to integrate FRAME into their own systems. Instead of using the built-in web interface, the API returns assessment results in JSON format, allowing organizations to build their own user interfaces, automate metadata validation workflows, or integrate FRAME with existing repository platforms.

## Prerequisites and Configuration

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
git clone https://github.com/ncu-cryosensing/FRAME.git
cd FRAME
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
## Option 3: Run API
### Navigate to the API Service Directory

```bash
cd FRAME/api-service
```
### Install Dependencies

```bash
npm install
```

### Start the Development Server

```bash
npm run start
```

Open http://localhost:3006 in your browser.
## Dev team and contact 

The NCU CryoSensing Team. https://www.ncu-cryosensing.org/
