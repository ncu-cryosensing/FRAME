#  FRAME 

![Read-The-Docs-Badge](https://app.readthedocs.org/projects/frame-metadata-assessment/badge/)

FRAME (**FAIR Review and Metadata Evaluation Engine**) is a web-based tool to assess the quality and completeness of the metadata for a given dataset based on the FAIR (Findable, Accessible, Interoperable, and Reusable) principles. With predefined criteria, FRAME accesses the metadata via a URL, reviews the content, validates its FAIRness, and finally provides quality scores for the metadata. This tool is designed for researchers and dataset administrators who need to host or use open datasets, as it provides a common basis for communication about data sharing, an important component of open science. 

![FRAME-Logo](docs/FRAME-Logo.png)

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

<!-- ## Features

-   **URL-based fetch** of JSON or XML (`application/json`,
    `application/xml`, `text/xml`, or JSON served as `text/plain`)
-   **Robust XML → JSON** conversion using `fast-xml-parser`
-   **FAIR checks** with per-principle tallies and overall counts
-   **Visual summary** via `SummaryChart` and per-principle progress
    sections
-   **Tabbed checklists** (Passed, Failed, Warnings, Info) -->

<!-- The tool supports dynamic configuration using JSON, allowing users to easily customize validation rules without modifying the application source code. -->

<!-- By externalizing validation logic into JSON files, the system becomes flexible, easily maintainable, adaptable to different metadata standards, and scalable for new validation requirements. -->

## Quick start

FRAME can be accessed and used in various ways, as described below.

### Example server

We provide an [example server](https://taipidata.ncu.edu.tw/frame/) with FRAME running, so you can see how it works without installing or setting it up on your local machines. Feel free to try it!

### Using Docker

If you would like to try FRAME on your local machine, [Docker](https://www.docker.com/) is the easiest way to get started because it does not require Node.js or project dependencies to be installed. It is recommended for users who simply want to check out FRAME with minimal setup. 

We have provided a Docker image containing FRAME on [Docker Hub](https://hub.docker.com/r/taipidata/frame), so you do not need to download anything. Just install Docker and simply run 

```bash
sudo docker run -it -p 3000:3000 -p 3005:3005 -p 3006:3006 taipidata/frame start
```

<!-- port 3000 is the main port for the GUI
port 3005 is for accessing AI assessment?
port 3006 is to  
Flexible -->

<!-- AI key already inlcuded -->

After the container is initiated, open `http://localhost:3000` in your browser, and you will see the landing page of the FRAME user interface.

For this Docker image, an [OpenRouter](https://openrouter.ai/keys) API key is provided, so there is no need to fetch another AI API key for the AI assessment.

<!-- The trade-off is that modifying the application source code requires entering the Docker container and rebuilding or committing a new image. -->

### Install manually

Alternatively, you can install FRAME manually on your local machine. This requires Node.js, npm, and other project dependencies to be installed together. 

<!-- gives users  customize or extend FRAME Changes to the UI, validation logic, or other application components can be made and tested immediately during development. It provides direct access to the source code.  -->

#### Steps

1. Make sure the following software is installed. 

  - **Node.js 16 or later**
  - **npm** (included with Node.js) or **yarn**

2. (Optional but recommended) If you would like to activate AI assessments for full functionality, you will need an API key from an AI agent. Here we recommend getting an API key from [OpenRouter](https://openrouter.ai/keys). Once you obtain an AI API key, create a `.env` file in the `api-service` folder with the following content:

  ```env
  OPENROUTER_API_KEY=your_ai_api_key
  ```

  Remember to replace `your_ai_api_key` with your actual API key.

3. Get the source code of FRAME from the project repository, and navigate to the project folder:

  ```bash
  git clone https://github.com/ncu-cryosensing/FRAME.git
  cd FRAME
  ```

4. Install dependencies and start the FRAME server:

  ```bash
  npm install
  npm run start
  ```

  Once the server is activated, open your browser and go to `http://localhost:3000`. You will see the landing page of the FRAME user interface.


<!-- ### Build for Production

```bash
npm run build
``` -->

### Using FRAME API

FRAME's API service is designed for developers and data repository administrators who want to integrate FRAME into their own systems. Instead of using the built-in FRAME GUI, the API accepts a JSON-formatted metadata record and returns an assessment report in JSON.

To use the FRAME API, simply follow the instructions above and get FRAME using Docker or manual installation. After the server starts, you can access localhost using a web browser on a different port: `http://localhost:3006` (default) for instructions and API usage examples. 

<!-- , allowing them to build their own user interfaces, automate metadata validation workflows, or integrate FRAME with existing repository platforms. -->

## License

MIT License. See the license file for details.

## Dev team and contact 

For development questions or potential collaboration, feel free to open an issue or reach out to the CryoSensing Team at National Central University. https://www.ncu-cryosensing.org/

Pull Requests to the dev branch are also welcome!