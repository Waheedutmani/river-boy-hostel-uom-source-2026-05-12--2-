const http = require('http');
const { URL } = require('url');
const next = require('next');

const app = next({ dev: false, hostname: '0.0.0.0', port: 3000 });
const handle = app.getRequestHandler();

async function warmUp() {
  // Pre-warm key API routes by making internal requests
  const routes = [
    '/api/auth/login',
    '/api/notifications', 
    '/api/dashboard',
    '/api/students'
  ];
  
  for (const route of routes) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port: 3000,
          path: route,
          method: route === '/api/auth/login' ? 'POST' : 'GET',
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log(`Warmed ${route}: ${res.statusCode}`);
            resolve();
          });
        });
        req.on('error', (e) => {
          console.log(`Warm ${route} error: ${e.message}`);
          resolve(); // Don't fail on warm-up errors
        });
        req.on('timeout', () => {
          req.destroy();
          resolve();
        });
        if (route === '/api/auth/login') {
          req.write(JSON.stringify({email:'admin@riverboyuom.edu.pk', password:'admin123'}));
        }
        req.end();
      });
    } catch (e) {
      console.log(`Warm ${route} failed: ${e.message}`);
    }
  }
}

app.prepare().then(async () => {
  const srv = http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error:', err.message);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('error');
      }
    }
  });
  
  srv.listen(3000, '0.0.0.0', async () => {
    console.log('READY on 3000');
    // Warm up routes
    await warmUp();
    console.log('WARM-UP COMPLETE - Server is fully loaded');
  });
});
