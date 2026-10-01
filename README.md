# ai-integratio-testing

## Configure your Gemini API key

1. Open `.env`.
2. Replace the placeholder value:

   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```

3. Install dependencies and start the local server:

   ```bash
   npm install
   npm start
   ```

4. Open http://localhost:3000.

The server loads `.env` with `dotenv` and injects `GEMINI_API_KEY` into the page as `window.__ENV__`, which the existing frontend uses for the Gemini request.

**Security note:** This browser-only app sends the key to the client, so the key can be viewed by anyone who can access the app. Restrict the key in Google AI Studio, and never replace the placeholder in `.env` with a real key before committing or sharing the repository.
