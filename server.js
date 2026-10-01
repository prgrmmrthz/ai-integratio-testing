const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const port = process.env.PORT || 3000;
const indexPath = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  if (req.url !== '/' && req.url !== '/index.html') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  let html = fs.readFileSync(indexPath, 'utf8');
  const envScript = `<script>window.__ENV__ = { GEMINI_API_KEY: ${JSON.stringify(process.env.GEMINI_API_KEY || '')} };</script>`;

  // Inject the .env value into the browser at request time. The existing app
  // reads window.__ENV__.GEMINI_API_KEY before making the Gemini request.
  html = html.replace('</head>', `${envScript}</head>`);

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(port, () => {
  console.log(`RiceGuard is running at http://localhost:${port}`);
});
