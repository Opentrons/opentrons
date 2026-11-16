#!/usr/bin/env python3
"""Serve this folder on 127.0.0.1 so the page can fetch versions.json.

Browsers block fetch() on file:// URLs, so open the page through this server.
Generate versions.json first with build_versions.py.

Usage: python3 serve.py [port]   (default port 8766)
"""

import functools
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    handler = functools.partial(SimpleHTTPRequestHandler, directory=HERE)
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    print(f"Serving {HERE} at http://127.0.0.1:{port}/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
