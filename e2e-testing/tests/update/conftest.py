"""Fixtures for update-server E2E tests."""

from __future__ import annotations

import os
import subprocess
import time
import urllib.request
from collections.abc import Generator

import pytest

from automation.clients.update import DEFAULT_UPDATE_SERVER_PORT, UpdateClient

UPDATE_SERVER_PORTS = [DEFAULT_UPDATE_SERVER_PORT]


def _is_update_server_running(url: str, timeout: int = 2) -> bool:
    """Check if the update-server is responding at *url*."""
    try:
        urllib.request.urlopen(f"{url}/server/update/health", timeout=timeout)
        return True
    except Exception:
        return False


def _find_running_update_server() -> str | None:
    """Return the URL of a running update-server, or None."""
    for port in UPDATE_SERVER_PORTS:
        url = f"http://localhost:{port}"
        if _is_update_server_running(url):
            return url
    return None


def _wait_for_update_server(url: str, timeout: int = 60) -> bool:
    """Block until the update-server at *url* starts responding."""
    start = time.monotonic()
    while time.monotonic() - start < timeout:
        if _is_update_server_running(url):
            return True
        time.sleep(1)
    return False


def _start_update_server() -> Generator[str, None, None]:
    """Start or reuse a local update-server."""
    skip_server = os.environ.get("SKIP_SERVER_START", "false").lower() == "true"

    existing = _find_running_update_server()
    if existing:
        print(f"\n✓ Update-server already running on {existing}, skipping startup")
        yield existing
        return

    if skip_server:
        fallback_url = f"http://localhost:{DEFAULT_UPDATE_SERVER_PORT}"
        print(
            "\n⚠️  SKIP_SERVER_START is set and no existing update-server detected; "
            "returning fallback URL without starting server."
        )
        yield fallback_url
        return

    print("\nStarting update-server...")
    print("=" * 80)

    server_process = subprocess.Popen(
        ["make", "-C", "../update-server", "dev"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    server_url = f"http://localhost:{DEFAULT_UPDATE_SERVER_PORT}"

    if not _wait_for_update_server(server_url, timeout=60):
        if server_process.stdout:
            output = server_process.stdout.read()
            if output:
                print(output)
        server_process.kill()
        pytest.skip(
            "Local update-server dev startup is not supported on this host. "
            "Set UPDATE_SERVER_URL to run update E2E tests against a running server."
        )

    print(f"✅ Update-server is ready on {server_url}")
    print("=" * 80)

    try:
        yield server_url
    finally:
        print("\nStopping update-server...")
        server_process.terminate()
        try:
            server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            print("⚠️  Update-server did not exit in time; sending SIGKILL.")
            server_process.kill()
            server_process.wait(timeout=5)
        if server_process.stdout:
            server_process.stdout.close()


@pytest.fixture(scope="session")
def update_base_url() -> Generator[str, None, None]:
    """Resolve the update-server base URL."""
    env_url = os.environ.get("UPDATE_SERVER_URL")
    if env_url:
        yield env_url
        return

    yield from _start_update_server()


@pytest.fixture(scope="session")
def update_client(update_base_url: str) -> Generator[UpdateClient, None, None]:
    """Session-scoped update-server client."""
    with UpdateClient(base_url=update_base_url) as client:
        yield client


@pytest.fixture()
def clean_update_session(update_client: UpdateClient) -> Generator[None, None, None]:
    """Cancel any leftover update session before and after a test."""
    update_client.cancel_update()
    try:
        yield
    finally:
        update_client.cancel_update()
