import React,
{
  useState
}
from "react";

function GenerateJson() {

const [formData, setFormData] = useState({

  metadataGeneratedBy: "taipidata",
  id: "",
  title: "",
  metadataIdentifier: "",

  authors: [
    {
      name: "",
      orcid: "",
      affiliation: ""
    }
  ],

  corresponding_author: "",

  publicationDate: "",
  doi: "",

  short_description: "",
  documentation: "",

  spatialExtent: "",

  license: "",

  url_download: "",
  url_map: "",
  url_taipihub: "",
  url_api: "",

  award: "",

  resourceType: ""

});

function updateField(name, value) {

  setFormData({

    ...formData,

    [name]: value

  });

}

function updateAuthor(index, field, value) {

  const updated =
    [...formData.authors];

  updated[index][field] =
    value;

  setFormData({

    ...formData,

    authors: updated

  });

}

function addAuthor() {

  setFormData({

    ...formData,

    authors: [

      ...formData.authors,

      {
        name: "",
        orcid: "",
        affiliation: ""
      }

    ]

  });

}

function generateJSON() {

  const blob =
    new Blob(

      [
        JSON.stringify(
          formData,
          null,
          2
        )
      ],

      {
        type:
          "application/json"
      }

    );

  const url =
    URL.createObjectURL(
      blob
    );

  const a =
    document.createElement(
      "a"
    );

  a.href =
    url;

  a.download =
    "taipi-metadata.json";

  a.click();

  URL.revokeObjectURL(url);

}

return (

<div>

<h2 className="mb-3">

Generate TaiPI JSON

</h2>


<div className="row g-3">

<div className="col-md-6">

<label>ID</label>

<input
className="form-control"
value={formData.id}
onChange={e =>
updateField("id", e.target.value)}
/>

</div>


<div className="col-md-6">

<label>Metadata Identifier</label>

<input
className="form-control"
value={formData.metadataIdentifier}
onChange={e =>
updateField(
"metadataIdentifier",
e.target.value)}
/>

</div>


<div className="col-12">

<label>Title</label>

<input
className="form-control"
value={formData.title}
onChange={e =>
updateField("title", e.target.value)}
/>

</div>

<label> Authors </label>

{
formData.authors.map(

(a,i)=>(

<div
key={i}
className="row g-2 mb-2"
>

<div className="col-md-4">

<input
placeholder="Name"
className="form-control"
value={a.name}
onChange={e =>
updateAuthor(
i,
"name",
e.target.value)}
/>

</div>


<div className="col-md-4">

<input
placeholder="ORCID"
className="form-control"
value={a.orcid}
onChange={e =>
updateAuthor(
i,
"orcid",
e.target.value)}
/>

</div>


<div className="col-md-4">

<input
placeholder="Affiliation"
className="form-control"
value={a.affiliation}
onChange={e =>
updateAuthor(
i,
"affiliation",
e.target.value)}
/>

</div>

</div>

)

)}


<button
onClick={addAuthor}
className="btn btn-outline-primary mt-2"
>

Add Author

</button>
<div className="col-12">

<label>Corresponding author</label>

<input
className="form-control"
placeholder="Email"
value={formData.corresponding_author}
onChange={e =>
updateField("corresponding_author", e.target.value)}
/>

</div>

<div className="col-md-6">

<label>Publication Date</label>

<input
type="date"
className="form-control"
value={formData.publicationDate}
onChange={e =>
updateField(
"publicationDate",
e.target.value)}
/>

</div>


<div className="col-md-6">

<label>DOI</label>

<input
className="form-control"
value={formData.doi}
onChange={e =>
updateField("doi", e.target.value)}
/>

</div>


<div className="col-12">

<label>Short Description</label>

<textarea
className="form-control"
rows={3}
value={formData.short_description}
onChange={e =>
updateField(
"short_description",
e.target.value)}
/>

</div>


<div className="col-12">

<label>Documentation</label>

<textarea
className="form-control"
style={{ height: "400px" }}
rows={3}
value={formData.documentation}
onChange={e =>
updateField(
"documentation",
e.target.value)}
/>

</div>

<div className="col-12">

<label>Spatial extent</label>

<input
className="form-control"
value={formData.spatialExtent}
onChange={e =>
updateField("spatialExtent", e.target.value)}
/>

</div>
<div className="col-md-6">

<label>License</label>

<input
className="form-control"
value={formData.license}
onChange={e =>
updateField("license", e.target.value)}
/>

</div>


<div className="col-md-6">

<label>Resource Type</label>

<input
className="form-control"
value={formData.resourceType}
onChange={e =>
updateField(
"resourceType",
e.target.value)}
/>

</div>

</div>
<br/>
<div className="col-12">

<label>Award</label>

<input
className="form-control"
value={formData.award}
onChange={e =>
updateField("award", e.target.value)}
/>

</div>

<br/>
<div className="col-12">

<label>File Download URL</label>

<input
className="form-control"
value={formData.url_download}
onChange={e =>
updateField("url_download", e.target.value)}
/>

</div>

    <br/>
<div className="col-12">

<label>Maps URL</label>

<input
className="form-control"
value={formData.url_map}
onChange={e =>
updateField("url_map", e.target.value)}
/>

</div>

 <br/>
<div className="col-12">

<label>JupyterHub/TaiPIHub URL</label>

<input
className="form-control"
value={formData.url_taipihub}
onChange={e =>
updateField("url_taipihub", e.target.value)}
/>

</div>

<br/>
<div className="col-12">

<label>API URL</label>

<input
className="form-control"
value={formData.url_api}
onChange={e =>
updateField("url_api", e.target.value)}
/>

</div>

<br/>
<br/>


<button
onClick={generateJSON}
className="btn btn-success"
>

Generate JSON

</button>


</div>

);

}

export default GenerateJson;