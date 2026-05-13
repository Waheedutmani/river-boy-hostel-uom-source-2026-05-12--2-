const next = require('/home/z/my-project/node_modules/next');
const { createServer } = require('http');
const { parse } = require('url');

const app = next({ dev: false, dir: '/home/z/my-project' });
const handle = app.getRequestHandler();

// Keep process alive
setInterval(() => {}, 60000);

// Handle signals gracefully
process.on('SIGTERM', () => console.log('SIGTERM received'));
process.on('SIGINT', () => console.log('SIGINT received'));

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    } catch(e) {
      res.statusCode = 500;
      res.end('Internal error');
    }
  });
  
  server.listen(3000, '0.0.0.0', () => {
    console.log('> Server ready on http://0.0.0.0:3000');
  });
  
  server.on('error', (e) => {
    console.error('Server error:', e);
  });
}).catch(e => {
  console.error('Prep error:', e);
  process.exit(1);
});
