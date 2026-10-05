#!/usr/bin/env python3
"""Serves the site the way GitHub Pages does, for the tests.

Pages resolves /blog/almanca-akkusativ to blog/almanca-akkusativ.html. Python's
own http.server does not, so every blog link would 404 under test and the suite
would be testing a site that does not exist anywhere.
"""
import functools, http.server, os, socketserver, sys

ROOT = os.path.dirname(os.path.abspath(__file__))


class Pages(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        local = super().translate_path(path)
        if not os.path.exists(local) and not path.endswith('/'):
            html = local + '.html'
            if os.path.exists(html):
                return html
        return local

    def log_message(self, *args):
        pass  # the test runner has its own output


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    handler = functools.partial(Pages, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', port), handler) as httpd:
        print(f'serving {ROOT} on http://127.0.0.1:{port}')
        httpd.serve_forever()
