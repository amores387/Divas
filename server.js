const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = 5000;
const HOST = '0.0.0.0';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      let isVideo = res.headers['content-type'] && (res.headers['content-type'].includes('video') || res.headers['content-type'].includes('octet-stream'));
      
      if (isVideo) {
        let buffer = Buffer.alloc(0);
        res.on('data', chunk => {
          buffer = Buffer.concat([buffer, chunk]);
        });
        res.on('end', () => {
          const base64 = buffer.toString('base64');
          const dataUrl = `data:video/mp4;base64,${base64}`;
          resolve({ video_url: dataUrl });
        });
      } else {
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ error: 'Invalid response format', raw: data });
          }
        });
      }
    }).on('error', reject);
  });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.url.startsWith('/api/proxy')) {
    const params = new URLSearchParams(req.url.split('?')[1]);
    const apiUrl = params.get('url');
    
    if (!apiUrl) {
      res.statusCode = 400;
      res.end(JSON.stringify({error: 'Missing url parameter'}));
      return;
    }

    makeRequest(apiUrl).then(data => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    }).catch(err => {
      console.error('Proxy error:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({error: 'Proxy request failed'}));
    });
    return;
  }

  let filePath = path.join(__dirname, req.url === '/' ? '/index.html' : req.url);
  filePath = path.normalize(filePath);

  if (!filePath.startsWith(path.join(__dirname))) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.statusCode = 404;
        res.end('Not Found');
      } else {
        res.statusCode = 500;
        res.end('Server Error');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.statusCode = 200;
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});