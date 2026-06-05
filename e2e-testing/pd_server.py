"""Start and manage a local Protocol Designer preview server for e2e tests.

Run via ``make serve-pd`` from e2e-testing/. Pytest discovers an already-running
server; it does not start PD itself (required for pytest-xdist).

Locally and in CI use the same entrypoint: ``make serve-pd`` (runs ``make serve``
in protocol-designer, which builds and serves in one step).
"""

from __future__ import annotations

import argparse
import os
import select
import signal
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from typing import Literal

PD_SERVER_PORTS = [4173, 4174, 4175]

APP_TITLE_FINGERPRINTS: dict[str, str] = {
    "pd": "Protocol Designer",
    "ll": "Labware Library",
}

E2E_DIR = Path(__file__).resolve().parent
PD_MAKE_DIR = E2E_DIR.parent / "protocol-designer"

MAX_START_ATTEMPTS = 120
POLL_INTERVAL_SECONDS = 2


def is_http_server_running(url: str, timeout: int = 1) -> bool:
    """Return True if an HTTP server responds at *url*."""
    try:
        urllib.request.urlopen(url, timeout=timeout)
        return True
    except Exception:
        return False


def verify_server_identity(url: str, app: Literal["pd", "ll"], timeout: int = 2) -> bool:
    """Return True if *url* serves the expected app (checked via HTML ``<title>``)."""
    fingerprint = APP_TITLE_FINGERPRINTS[app]
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            body = resp.read(4096).decode("utf-8", errors="replace")
            return fingerprint.lower() in body.lower()
    except Exception:
        return False


def find_running_server(
    ports_to_check: list[int],
    app: Literal["pd", "ll"] | None = None,
) -> str | None:
    """Return the URL of a running server on localhost, or None."""
    for port in ports_to_check:
        url = f"http://localhost:{port}"
        if is_http_server_running(url):
            if app is not None and not verify_server_identity(url, app):
                print(
                    f"\n⚠️  Server on {url} is responding but does not look like "
                    f"{app.upper()} (expected '{APP_TITLE_FINGERPRINTS[app]}' in "
                    f"<title>).  Skipping."
                )
                continue
            return url
    return None


def wait_for_server_ready(
    ports_to_check: list[int],
    timeout: int = 240,
    app: Literal["pd", "ll"] | None = None,
) -> str | None:
    """Poll until a server is available on one of *ports_to_check*, or timeout."""
    start = time.monotonic()
    while time.monotonic() - start < timeout:
        running_server = find_running_server(ports_to_check, app=app)
        if running_server:
            return running_server
        time.sleep(1)
    return None


def _pd_serve_command() -> list[str]:
    return ["make", "-C", str(PD_MAKE_DIR), "serve"]


def _wait_for_new_pd_server(
    server_process: subprocess.Popen[str],
    ports_to_try: list[int],
) -> str:
    """Block until the preview server is ready or the child process exits."""
    server_url: str | None = None

    for attempt in range(MAX_START_ATTEMPTS):
        if server_process.poll() is not None:
            if server_process.stdout:
                remaining_output = server_process.stdout.read()
                if remaining_output:
                    print(remaining_output, end="")
            print(f"\n❌ Server process exited unexpectedly with code {server_process.returncode}")
            raise RuntimeError(
                f"Server process exited with code {server_process.returncode}. Check output above for errors."
            )

        if server_process.stdout and select.select([server_process.stdout], [], [], 0.1)[0]:
            line = server_process.stdout.readline()
            if line:
                print(line, end="")

        for port in ports_to_try:
            test_url = f"http://localhost:{port}"
            if not is_http_server_running(test_url):
                continue
            if not verify_server_identity(test_url, "pd"):
                continue
            print(f"✅ Protocol Designer is ready on {test_url}")
            server_url = test_url
            break

        if server_url:
            break

        if attempt > 0 and attempt % 10 == 0:
            elapsed = attempt * POLL_INTERVAL_SECONDS
            print(f"  Still waiting for server... ({elapsed}s elapsed)")

        if attempt == MAX_START_ATTEMPTS - 1:
            print(f"\n❌ Server failed to start after {MAX_START_ATTEMPTS * POLL_INTERVAL_SECONDS} seconds")
            server_process.kill()
            raise RuntimeError(
                f"Protocol Designer failed to start on any port: {ports_to_try}. "
                f"Waited {MAX_START_ATTEMPTS * POLL_INTERVAL_SECONDS} seconds."
            )
        time.sleep(POLL_INTERVAL_SECONDS)

    assert server_url is not None
    return server_url


def _stop_server_process(server_process: subprocess.Popen[str]) -> None:
    print("\nStopping Protocol Designer server...")
    server_process.terminate()
    try:
        server_process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        print("⚠️  Server did not exit in time; sending SIGKILL.")
        server_process.kill()
        server_process.wait(timeout=5)
    if server_process.stdout:
        server_process.stdout.close()


def run_pd_server() -> int:
    """Start PD via ``make serve`` if needed, then block until interrupted."""
    existing_server = find_running_server(PD_SERVER_PORTS, app="pd")
    if existing_server:
        print(f"\n✓ Protocol Designer already running on {existing_server}")
        os.environ["PD_SERVER_URL"] = existing_server
        print(f"PD_SERVER_URL={existing_server}")
        return 0

    print("\nStarting Protocol Designer (make serve — build and preview)...")
    print("This may take 2-3 minutes...")
    print("=" * 80)

    server_process = subprocess.Popen(
        _pd_serve_command(),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    try:
        server_url = _wait_for_new_pd_server(server_process, PD_SERVER_PORTS)
    except RuntimeError:
        return 1

    print("=" * 80)
    os.environ["PD_SERVER_URL"] = server_url
    print(f"PD_SERVER_URL={server_url}")
    print("Press Ctrl+C to stop the server.")

    def _handle_signal(signum: int, frame: object | None) -> None:
        _stop_server_process(server_process)
        sys.exit(0)

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    try:
        server_process.wait()
    except KeyboardInterrupt:
        _stop_server_process(server_process)
        return 0

    if server_process.returncode not in (0, None):
        return server_process.returncode or 1
    return 0


def wait_for_pd_server(timeout: int = 240) -> int:
    """Block until PD responds on a known port, then exit (for CI/Makefile orchestration)."""
    server_url = wait_for_server_ready(PD_SERVER_PORTS, timeout=timeout, app="pd")
    if not server_url:
        print(f"\n❌ Protocol Designer not ready after {timeout}s")
        return 1
    os.environ["PD_SERVER_URL"] = server_url
    print(f"PD_SERVER_URL={server_url}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run Protocol Designer for e2e tests (make serve in protocol-designer/)."
    )
    parser.add_argument(
        "--wait",
        action="store_true",
        help="Wait until PD is reachable, print URL, and exit (does not start a server).",
    )
    args = parser.parse_args()

    if args.wait:
        return wait_for_pd_server()

    return run_pd_server()


if __name__ == "__main__":
    raise SystemExit(main())
