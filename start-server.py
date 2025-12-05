#!/usr/bin/env python3
"""
Simple HTTP server for serving the project.
Run this script to start the server on port 8000.
"""
import os
import http.server
import socketserver
from pathlib import Path

PORT = 8000
HOST = '0.0.0.0'

class SimpleHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        """Add cache-control headers to prevent caching."""
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    os.chdir(Path(__file__).parent)
    
    print(f'[Server]')
    print(f'Local:   http://127.0.0.1:{PORT}')
    print(f'Network: http://0.0.0.0:{PORT}')
    print(f'Press Ctrl+C to stop\n')
    
    with socketserver.TCPServer((HOST, PORT), SimpleHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n[Server] Stopped.')
