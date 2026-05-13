const http = require('http');
const { URL } = require('url');
const next = require('next');

const app = next({ dev: false, hostname: '0.0.0.0', port: 3001 });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      // Only handle API routes
      if (req.url.startsWith('/api/')) {
        await handle(req, res, parsedUrl);
      } else {
        res.statusCode = 404;
        res.end('Not found - use main server for pages');
      }
    } catch (err) {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    }
  });
  
  server.listen(3001, '0.0.0.0', () => {
    console.log('API server on 3001');
  });
  
  setInterval(() => {}, 60000);
});
