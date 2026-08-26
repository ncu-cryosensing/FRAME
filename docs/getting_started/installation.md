# Accessing FRAME online or locally

FRAME can be accessed and used in different ways, which are described below.

## Example server

We provide an [example server](https://taipidata.ncu.edu.tw/metadata-assessment/) with FRAME running, so you can see how it works without installing or setting it up on your local machines. Feel free to try it!

## Using Docker

If you would like to try FRAME on your local machine, then Docker should be the easiest way to get started because it does not require Node.js or project dependencies to be installed on the machine. It is recommended for users who simply want to check out FRAME with minimal setup. 

To start the Docker container for FRAME, simply run

<!-- ```bash
docker run -it -p 3000:3000 taipidata/metadata_assessment start
``` -->

After the container is initiated, open `http://localhost:3000` in your browser, and you will see the landing page of the FRAME user interface.

<!-- The trade-off is that modifying the application source code requires entering the Docker container and rebuilding or committing a new image. -->

## Install manually

Alternatively, you can install FRAME manually on your local machine. This requires Node.js, npm, and other project dependencies to be installed together. 

<!-- gives users  customize or extend FRAME Changes to the UI, validation logic, or other application components can be made and tested immediately during development. It provides direct access to the source code.  -->

### Steps

1. Make sure the following software is installed. You will need these packages to proceed.

  - **Node.js 16 or later**
  - **npm** (included with Node.js) or **yarn**

2. (Optional) If you would like to activate AI assessments for the metadata content, you will need an API key from the AI agent. Here we recommend getting an API key from [OpenRouter](https://openrouter.ai/keys). Once you obtain an AI API key, create a `.env` file in the `api-service` folder with the following content:

  ```env
  OPENROUTER_API_KEY=your_ai_api_key
  ```

  Remember to replace `your_ai_api_key` with your actual API key!

3. Get the source code of FRAME from the project repository, and navigate to the project folder:

  ```bash
  git clone https://github.com/ncu-cryosensing/FRAME.git
  cd FRAME
  ```

4. Install dependencies:

  ```bash
  npm install
  ```
  
5. Start the FRAME server:

  ```bash
  npm run start
  ```

  Once the server is activated, open your browser and go to `http://localhost:3000`. You will see the landing page of the FRAME user interface.


<!-- ### Build for Production

```bash
npm run build
``` -->

