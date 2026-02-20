#!/usr/bin/env python3
"""Hit the robot health endpoint by IP address.

Requires: httpx (pip install httpx)

Usage:
    python check_health.py 10.14.19.233
    python check_health.py 10.14.19.233 --port 31960  # OT-3
    python check_health.py 10.14.19.233 --update      # /server/update/health
"""

import argparse
import json
import sys

import httpx


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check robot health by hitting the health endpoint."
    )
    parser.add_argument(
        "ip",
        help="Robot IP address (e.g. 10.14.19.233)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=31950,
        help="Port (default: 31950 for OT-2, use 31960 for OT-3)",
    )
    parser.add_argument(
        "--update",
        action="store_true",
        help="Hit /server/update/health instead of /health",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=10.0,
        help="Request timeout in seconds (default: 10)",
    )
    args = parser.parse_args()

    path = "/server/update/health" if args.update else "/health"
    url = f"http://{args.ip}:{args.port}{path}"

    try:
        with httpx.Client(
            headers={"Opentrons-Version": "*"},
            timeout=args.timeout,
        ) as client:
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.json()
            print(json.dumps(data, indent=2))
            return 0
    except httpx.HTTPStatusError as e:
        print(f"HTTP {e.response.status_code}: {e.response.reason_phrase}", file=sys.stderr)
        print(e.response.text, file=sys.stderr)
        return 1
    except httpx.ConnectError as e:
        print(f"Connection error: {e}", file=sys.stderr)
        return 1
    except httpx.RequestError as e:
        print(f"Request error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
