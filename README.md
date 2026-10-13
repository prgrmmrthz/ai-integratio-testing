# RiceGuard

RiceGuard is a React, TypeScript, and Redux Toolkit app for checking rice plant
photos with the Gemini Vision API.

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Open the URL printed by Vite (usually http://localhost:5173).
4. Open Settings in the app and enter your Gemini API key. The key is stored in
   your browser's local storage.

Create a key in [Google AI Studio](https://aistudio.google.com/app/apikey).
Because the app calls Gemini directly from the browser, the key is visible to
the browser and should be restricted appropriately. Do not commit real API keys.

If Gemini returns a temporary 503 overload error, RiceGuard retries the request
automatically. If it still fails, wait a moment and select **Try Again**.

## Build

```bash
npm run build
npm run preview
```
