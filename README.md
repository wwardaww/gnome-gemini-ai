# Gemini AI Chat for Gnome (v4+)

This add-on uses the Gemini 1.0 Pro model for chatting.

## Using the Gemini API Key

1. Go to [Google AI](https://ai.google.dev/) and click "Get API key in Google AI Studio."
2. On the [API key page](https://aistudio.google.com/app/apikey), you can create a new API key for Gemini.
   - **Note:** If you plan to use the Vertex API, choose "create new project."
3. Copy the API key to the add-on settings.
4. All done!

## Using the Vertex API (ADVANCED)

**Note:** The Vertex API is a SaaS (paid service) from Google, so at least you should know the following:

* Create billing information.
* Knowledge of gcloud-cli. Ref: [Install the gcloud CLI](https://cloud.google.com/sdk/docs/install)
* Shortcut for Auth: If you test the Vertex API from your account, it will generate Auth credentials. Ref:
  - [Google Dev Console](https://console.cloud.google.com/cloud-resource-manager) to learn your `PROJECT_ID`.
* After installing `gcloud-cli`, you need to log in via: `gcloud auth login`.
* Once you log in via CLI, you need to follow these steps (1-3) on your local: [Vertex AI Gemini API Beginner Guide](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal?cloudshell=true#gemini-beginner-samples-drest)
* Finally, you can create a JWT key by running: `gcloud auth application-default print-access-token` in the terminal.
  - **Note:** You need to manually create the JWT. Once you set the key to "Gemini API key" in the add-on settings, the add-on will automatically create new JWTs when the token expires.

## Additional Information

### Difference between Gemini API and Vertex API

Vertex has internet access and can be searched on the internet, but Gemini API has no internet access, and the model update date is **(06-2023)**, so it cannot react to recent events. Basically, Gemini is free but outdated, while Vertex is paid and outdated, but it can search on the internet when information isn't in the model.

### Prices for Vertex API (03-2024)

`GCP > Cloud AI and Industry Solutions > Vertex AI Model Garden > Language > Gemini > Gemini Pro`

Per Unit 1K output: **0.00036$**
Per Unit 1K input: **0.00012$**

* According to Google, "Per unit" means:
  > The SKU's pricing tier unit quantity. For example, if the tier price is \$1 per 1000000 Bytes, then this column will show 1000000.

**For reference:** When I was developing this add-on, I sent 248 requests (meaning 248 inputs and 248 outputs), and the cost was **0.019$.**

