# Troubleshooting & FAQ

## Troubleshooting

| Problem |	Common cause | Solution | 
| ---- | ---- | ---- |
| Port 3000/3005/3006 already in use | Another process is using the port, or a previous FRAME instance is still running. | Stop the old process (`Ctrl+C`) or change the port in `vite.config.js`. |
| GUI opens but assessments always fail / the spinner keeps running | The API (3006) or records (3005) service is not running; e.g. only `npm run dev:vite` was executed. | Run `npm run start` again and check the logs of all three services in the terminal. |
| AI checks do not run | The AI API key is not configured. | Create a `core/.env` file containing `API_KEY=…` (see [](../getting_started/installation.md)), then restart the server. |
| AI results do not update even though the metadata has changed | Only the changes to the short or full description will trigger the AI reassessments. | Update the short or full description to trigger an AI update, or use `?reassess=true` in the API request. |
| Zenodo/Dataverse/Arcticdata.io metadata is scored incorrectly | The repository record structure has changed. | Inspect the converters in `core/converter/` and `src/*Converters.jsx`; open an issue if you find a bug. |

## FAQ

- **Is my data sent to other servers?**
 
  Rule-based checks run entirely locally. Only the AI checks send portions of the metadata text to the AI service you configure in `core/.env`.

- **Does my metadata have to be in a specific format?**

  FRAME works with its own internal JSON format, but it automatically converts metadata from Zenodo (JSON), Dataverse (JSON) and the Arctic Data Center (EML XML). For other repositories, we suggest preparing the metadata in FRAME's JSON format or using `src/GenerateJson.jsx` as a conversion helper.

- **Where are the AI assessment results stored?**

  The AI assessment results are in the SQLite database `database.db` in the project folder.