#!/usr/bin/env python3
"""Local HTTP server for testing opentrons in Pyodide.

Serves the pyodide/ directory with CORS and directory listing enabled.
Also serves protocol files from analyses-snapshot-testing/files/protocols/
at the /protocols/ URL prefix.

Usage:
    make serve              # preferred (rebuilds wheels first)
    uv run --python 3.12 python serve.py [--port PORT]
"""

import argparse
import functools
import http.server
import sys
from pathlib import Path

PYODIDE_DIR = Path(__file__).resolve().parent
REPO_ROOT = PYODIDE_DIR.parent
FIXTURES_DIR = PYODIDE_DIR / "fixtures"
PROTOCOLS_SRC = REPO_ROOT / "analyses-snapshot-testing" / "files" / "protocols"

# Maps URL key → absolute Path.
# Pyodide-specific test fixtures live in pyodide/fixtures/.
# Real smoke protocols come from analyses-snapshot-testing/.
PROTOCOL_FILE_MAP: dict[str, Path] = {
    "flex_simple": PROTOCOLS_SRC / "Flex_S_v2_20_1000M_Simple.py",
    "flex_smoke": PROTOCOLS_SRC / "Flex_S_v2_21_P1000_96_GRIP_HS_MB_TC_TM_Smoke.py",
    "flex_csv_rtp": FIXTURES_DIR / "Flex_S_v2_20_P1000_csv_rtp_simple.py",
    "ot2_simple_p300": PROTOCOLS_SRC / "OT2_S_v2_20_P300M_Simple.py",
    "ot2_simple_p20": PROTOCOLS_SRC / "OT2_S_v2_20_P20M_Simple.py",
    "ot2_smoke": PROTOCOLS_SRC / "OT2_S_v2_19_P300M_P20S_HS_TC_TM_SmokeTestV3.py",
}


class CORSHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        super().end_headers()

    def translate_path(self, path: str) -> str:
        """Route /protocols/<key>.py to the correct source file."""
        if path.startswith("/protocols/"):
            key = path.removeprefix("/protocols/").removesuffix(".py")
            mapped = PROTOCOL_FILE_MAP.get(key)
            if mapped:
                return str(mapped)
            return str(PROTOCOLS_SRC / path.removeprefix("/protocols/"))
        return super().translate_path(path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()

    # Ensure dist/ exists so GET /dist/ returns 200 (directory listing)
    dist_dir = PYODIDE_DIR / "dist"
    dist_dir.mkdir(parents=True, exist_ok=True)

    serve_dir = str(PYODIDE_DIR)
    handler = functools.partial(CORSHandler, directory=serve_dir)

    with http.server.HTTPServer(("", args.port), handler) as httpd:
        url = f"http://localhost:{args.port}"
        print(f"Serving {serve_dir}")
        print(f"Protocol files from {PROTOCOLS_SRC}")
        print(f"Open {url} in your browser")
        print("Press Ctrl+C to stop\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
            sys.exit(0)


if __name__ == "__main__":
    main()
