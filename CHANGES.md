# CHANGES

## Verison 20+

* Bug fix for #5
* Bug fix for `_httpSession.queue_message is not a function`

## Version 19+

* Now you can use Gemini 1.5 Flash and Pro!
  * (Note: You need to get the beta test for Gemini 1.5. If you can see the 1.5 model on [Google AI](https://ai.google.dev/), you can use it!)

## Known Issues

1. Sometimes the API gets stuck (this is not related to the extension itself).
   * If you click the trash icon, it will send an empty query to the API, and then you should be able to use it.
2. On GNOME Shell 44.9, the error `"_httpSession.queue_message is not a function"` occurs.
   * For now, the _httpSession function acts like GNOME 45+, but the rest of GNOME acts like GNOME 40+, so we need to create a new branch for GNOME 45 and GNOME 46 (this is a work in progress).
3. Vertex still uses Gemini 1.0 Pro.
   * Once Vertex updates the model, I will also update Vertex.

### Report a Bug

If you encounter any issues, please create an issue on GitHub. I will fix them when I have free time.
