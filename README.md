# Gemini Ai Chat for Gnome (4+)

This Add-on is using gemini 1.0 pro model for chatting.

## Using Gemini API Key

1. Go to [Google Ai](https://ai.google.dev/) and click the `Get API key in Google AI studio`
2. On [API key page](https://aistudio.google.com/app/apikey) you can create new api key for gemini
   1. **Note:** if you are planing to use vertex api choose `create new project`
3. Copy the api key to addon settings
4. All done!

## Using Vertex API (ADVANCE)

**Note that:** Vertex api is a SaaS (paid service) from Google so atleast you should now theese:

* create billing information
* knowledge to gcloud-cli. ref: [Install the gcloud CLI](https://cloud.google.com/sdk/docs/install)
* Shortcut for Auth: If you test the vertex api from you account it will generate Auth credential. ref:
  * https://console.developers.google.com/apis/api/aiplatform.googleapis.com/overview?project=`PROJECT_ID`
  * if you create new project on Google Ai site you can learn your `PROJECT_ID` from [Google Dev Console](https://console.cloud.google.com/cloud-resource-manager)
* After the installization of `gloud-cli` you need to login via: `gcloud auth login`
* Once you login via cli you need to follow theese steps (1-3) on your local: [Vertex AI Gemini API Beginner Guide](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal?cloudshell=true#gemini-beginner-samples-drest)
* Finally you can create JWT key by: `gcloud auth application-default print-access-token` on terminal
  * **Note:** You need to create manually JWT, Once you set the key to `Gemini API key` on addon settings, the addon will automaticly create new JWT's when token was expired

## Additional infos

### Diffrence between Gemini API and Vertex API

Vertex has internet access and it can be search on internet but Gemini API has no internet accsess and model update date is **(06-2023)** so it can not react to recent events. Basicly Gemini is free but outdated, Vertex is paid, outated but it can search  on internet when info isn't in the model.

### Prices for Vertex API (03-2024)

`GCP > Cloud AI and Industry Solutions > Vertex AI Model Garden > Language > Gemini > Gemini Pro`

Per Unit 1K output: **0.00036$**

Per Unit 1K input: **0.00012$**

* According the google Per unit means:
  > * The SKU's pricing tier unit quantity. For example, if the tier price is \$1 per 1000000 Bytes, then this column will show 1000000.

**For referance**: when i developing this addon i send 248 request(it means 248 input and 248 output) and cost was **0.019$**

