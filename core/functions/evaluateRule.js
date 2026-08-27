import { countWords } from "./countWords.js";

export async function evaluateRule(
  md,
  rule,
  aiQuality, validurl, validdownload = {}
) {
  let value = md[rule.field];

  let count = 0;
  let condition = false;

  let aiResult1 = "";
  let aiResult2 = "";
  let validvalue = "";
  let urlvalue = "";
  let x_orcid="";
  let x_people="";
  let email="";
  let protocol="";
  let auth="";

 

  switch (rule.type) {

    case "exists":

      condition = !!value;
      email = md.corresponding_author
      protocol = `Dataset retrieval protocol: ${aiQuality.retrieval_protocol}`
      if (aiQuality.data_retrieval==="true") {
          
          auth = "Dataset access requires authorization."
      } 
      else {
          auth = "Dataset access does not require authorization."
      }
          

      break;


    case "wordCount":

      count = countWords(value);

      condition =
        count >= rule.min;

      break;


    case "arrayNotEmpty":

      condition = Array.isArray(value) && value.length > 0;
        
      x_orcid = value.length
      x_people = value.length
        

      break;

    case "valid":
          
      condition = validurl.validUrl;
  validvalue = validurl.UrlPage;
  

      break;

          case "validdownload":
          
      condition = validdownload.validUrl;
      urlvalue = validdownload.url;
  

      break;

    
    case "aiQuality1":
      if (!value) {

        condition = false;

        aiResult1 =
          "Short description is not present";

      } else if (!aiQuality.short_description) {

        condition = false;

        aiResult1 =
          "AI failed to assess Short Description";

      } else {

        condition =
          aiQuality.short_description !== "Poor";

        aiResult1 =
          `Readability and informativeness for Short Description is ${aiQuality.short_description}`;
      }

      break;


    case "aiQuality2":

      if (!value) {

        condition = false;

        aiResult2 =
          "Documentation is not present";

      } else if (!aiQuality.documentation) {

        condition = false;

        aiResult2 =
          "AI failed to assess Documentation";

      } else {

        condition =
          aiQuality.documentation !== "Poor";

        aiResult2 =
          `Readability and informativeness for Documentation is ${aiQuality.documentation}`;
      }

      break;

    case "aiQuality3":

  const aiValue = aiQuality?.[rule.field];

  condition = String(aiValue).toLowerCase().trim() === "true";

  break;
  }
  return {
    condition,

    context: {
      value,
      count,
      min: rule.min,
      aiResult1,
      aiResult2,
      validvalue,
        urlvalue,
        x_orcid,
        x_people,
        email,
        auth,
        protocol
      
    },
  };
}