#!/usr/bin/env python3
"""Serve this folder on 127.0.0.1 and forward the Flex build manifest.

builds.opentrons.com does not send CORS headers, so the page cannot read
its release manifest directly from a browser. This server forwards only the
allowlisted manifest paths below; everything else is served from this folder.

Usage: python3 serve.py [port]   (default port 8766)
"""

import functools
import os
import sys
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

UPSTREAM = {
    "/builds/ot3-oe/releases.json": "https://builds.opentrons.com/ot3-oe/releases.json",
}

HERE = os.path.dirname(os.path.abspath(__file__))


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?", 1)[0]
        upstream = UPSTREAM.get(path)
        if upstream is None:
            return super().do_GET()
        try:
            with urllib.request.urlopen(upstream, timeout=30) as response:
                body = response.read()
        except (urllib.error.URLError, TimeoutError) as error:
            message = f"upstream fetch failed: {error}".encode()
            self.send_response(502)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(message)))
            self.end_headers()
            self.wfile.write(message)
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    handler = functools.partial(Handler, directory=HERE)
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    print(f"Serving {HERE} at http://127.0.0.1:{port}/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
