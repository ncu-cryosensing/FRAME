# Accessing FRAME online or locally

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

3. Get the source code of FRAME from the project repository, navigate to the project folder, and install dependencies:

  ```bash
  git clone https://github.com/ncu-cryosensing/FRAME.git
  cd FRAME
  npm install
  ```

#### Start the web tool

If all dependencies are installed, you can start the FRAME server by executing `npm run start` in the FRAME folder. Once the server is activated, open your browser and go to `http://localhost:3000`. You will see the landing page of the FRAME user interface.


<!-- ### Build for Production

```bash
npm run build
``` -->

### Using FRAME API

FRAME's API service is designed for developers and data repository administrators who want to integrate FRAME into their own systems. Instead of using the built-in FRAME GUI, the API accepts a JSON-formatted metadata record and returns an assessment report in JSON.

To use the FRAME API, simply follow the instructions above and get FRAME using Docker or manual installation. After the server starts, you can access localhost using a web browser on a different port: `http://localhost:3006` (default) for instructions and API usage examples. 

<!-- , allowing them to build their own user interfaces, automate metadata validation workflows, or integrate FRAME with existing repository platforms. -->

