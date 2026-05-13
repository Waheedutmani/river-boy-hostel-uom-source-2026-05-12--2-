#!/usr/bin/env python3
import http.server
import os
import json
import subprocess
import threading
import time
import urllib.request
import urllib.parse

PORT = 3000
NEXT_DIR = '/home/z/my-project/.next'
STATIC_DIR = '/home/z/my-project/public'

class HybridHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            self.proxy_to_node('GET')
        elif self.path.startswith('/_next/static/'):
            self.serve_static()
        elif self.path == '/' or self.path == '':
            self.serve_html('index.html')
        else:
            self.serve_html_or_proxy()
    
    def do_POST(self):
        if self.path.startswith('/api/'):
            self.proxy_to_node('POST')
        else:
            self.send_error(404)
    
    def serve_static(self):
        # Serve from .next/static/
        file_path = os.path.join(NEXT_DIR, self.path.lstrip('/'))
        if os.path.exists(file_path):
            self.serve_file(file_path)
        else:
            self.send_error(404)
    
    def serve_html(self, filename):
        # Serve the pre-rendered HTML
        html_path = os.path.join(NEXT_DIR, 'server', 'app', filename)
        if os.path.exists(html_path):
            self.serve_file(html_path, 'text/html')
        else:
            self.proxy_to_node('GET')
    
    def serve_html_or_proxy(self):
        # Try serving static HTML first
        clean_path = self.path.split('?')[0].lstrip('/')
        if clean_path == '':
            clean_path = 'index.html'
        html_path = os.path.join(NEXT_DIR, 'server', 'app', clean_path + '.html')
        if not clean_path.endswith('.html') and os.path.exists(html_path):
            self.serve_file(html_path, 'text/html')
        else:
            self.proxy_to_node('GET')
    
    def serve_file(self, path, content_type=None):
        try:
            with open(path, 'rb') as f:
                content = f.read()
            if content_type is None:
                content_type = self.guess_type(path)
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(content))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, str(e))
    
    def proxy_to_node(self, method):
        # Forward to Node.js API server on port 3001
        try:
            url = f'http://127.0.0.1:3001{self.path}'
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else None
            
            req = urllib.request.Request(url, data=body, method=method)
            req.add_header('Content-Type', self.headers.get('Content-Type', 'application/json'))
            
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
                self.send_response(resp.status)
                for key, val in resp.getheaders():
                    if key.lower() not in ('transfer-encoding', 'connection'):
                        self.send_header(key, val)
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.URLError as e:
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'API server unavailable', 'detail': str(e)}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', PORT), HybridHandler)
    print(f'Hybrid server on port {PORT}')
    server.serve_forever()
