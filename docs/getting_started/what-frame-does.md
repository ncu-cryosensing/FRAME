# What does FRAME do?

## How it works

FRAME reads a metadata record formatted in JSON (JavaScript Object Notation). This tool then performs multiple checks defined in `fair_checks.json`. Finally, FRAME displays the status of each check and a summary report for further inspection. Here are some examples of the checks performed by FRAME:

- Dataset title length
- Presence of DOI (Digital Object Identifier)
- Author information, such as names, ORCIDs, and affiliations
- Date of publication
- Quality of description, readme, and documentation file(s)
- Public landing page
- Data access URLs, including direct downloads and API access
- License
- Spatial extent (spatial data only)
- Cloud-based integrations, such as an online visualization portal or JupyterHub