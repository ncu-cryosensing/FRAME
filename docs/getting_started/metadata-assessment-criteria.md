# List of quality checks

This page lists all quality checks that FRAME performs for a data set. The details of the corresponding FAIR principles are available [here](https://www.go-fair.org/fair-principles/). 

**Legend for the type of the check**
- No mark: Required check
- O: Optiocal check
- I: Show information only; no checks

## F - findable

| Type | Quality    | Criteria | Explanation | 
| -------- | ------- | --------- | --------- |
|   | Dataset title  | contains >= 4 words  | complying with FAIR: F2 |
|   | Creator names   | exist   | complying with FAIR: F2/R1 |
|   | Creator identifiers (ORCID) | exist | complying with FAIR: F1 |
|   | Creator affiliations | exist | complying with FAIR: F2 |
|   | Publication date | exists | complying with FAIR: F2/R1 |
|   | Digital object identifier (DOI) | exists | complying with FAIR: F1/F3/F4 |
|   | Short description | contains >= 20 words | complying with FAIR: F2/R1 |
|   | Full description | contains >= 100 words | complying with FAIR: F2/R1 |
| O | Spatial extent | exists | complying with FAIR: F2 |
| O | Host repository | indexed by search engine (**AI check**) | complying with FAIR: F4 |
| I | Name of the repository | | complying with FAIR: F4 |
| I | Metadata identifier | | complying with FAIR: F1/F3 |


## A - accessible 

| Type | Quality    | Criteria | Explanation | 
| -------- | ------- | --------- | --------- |
|   | DOI | is valid | complying with FAIR: A1 |
|   | Landing page URL | is valid | complying with FAIR: A1/A2 |
|   | Dataset retrieval URL | is valid | complying with FAIR: A1 |
| I | Interactive map | | complying with FAIR: A1 |
| I | Executable cloud environment | | complying with FAIR: A1 |
| I | API endpoints | | complying with FAIR: A1 |
| I | Dataset retrieval protocol (https/ftp/...) | | complying with FAIR: A1.1 |
| I | Requirement of access authorization | (**AI check**) | complying with FAIR: A1.2 |


## I - interoperable

| Type | Quality    | Criteria | Explanation | 
| -------- | ------- | --------- | --------- |
| O | Full description | uses formal specification language (**AI check**) | complying with FAIR: I1 |
| O | Full description | contains references (**AI check**) | complying with FAIR: I3 |

## R - reusable

| Type | Quality    | Criteria | Explanation | 
| -------- | ------- | --------- | --------- |
|   | Corresponding author assignment | exists | complying with FAIR: A1 |
|   | License | exists | complying with FAIR: R1.1 |
| O | Short description | quality of writing (**AI check**) | complying with FAIR: R1 |
| O | Full description | quality of writing (**AI check**) | complying with FAIR: R1 |
| O | Award numbers | exist | complying with FAIR: R1.2 |
| O | Funder names | exist | complying with FAIR: R1.2 |
| I | Resource type | | complying with FAIR: R1.3

<!-- ## Other checks -->