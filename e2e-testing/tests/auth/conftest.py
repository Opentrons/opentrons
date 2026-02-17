"""Fixtures for auth-server E2E tests."""

from __future__ import annotations

import os
import subprocess
import time
import urllib.request
from collections.abc import Generator

import pytest

from automation.auth_client import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    AuthClient,
    TokenResponse,
)

# Default port used by ``make dev`` in auth-server/.
AUTH_SERVER_DEFAULT_PORT = 33950
AUTH_SERVER_PORTS = [33950]


def _is_auth_server_running(url: str, timeout: int = 2) -> bool:
    """Check if the auth-server is responding at *url*.

    We probe ``GET /auth/settings`` because it's a cheap, always-available
    endpoint that doesn't require authentication.
    """
    try:
        urllib.request.urlopen(f"{url}/auth/settings", timeout=timeout)
        return True
    except Exception:
        return False


def _find_running_auth_server() -> str | None:
    """Return the URL of a running auth-server, or None."""
    for port in AUTH_SERVER_PORTS:
        url = f"http://localhost:{port}"
        if _is_auth_server_running(url):
            return url
    return None


def _wait_for_auth_server(url: str, timeout: int = 60) -> bool:
    """Block until the auth-server at *url* starts responding."""
    start = time.monotonic()
    while time.monotonic() - start < timeout:
        if _is_auth_server_running(url):
            return True
        time.sleep(1)
    return False


def _start_auth_server() -> Generator[str, None, None]:
    """Start or reuse a local auth-server.

    Mirrors the pattern used by ``_start_pd_server`` / ``_start_ll_server``
    in the top-level conftest:

    1. If the server is already running, reuse it.
    2. If ``SKIP_SERVER_START`` is set, yield the fallback URL without
       starting anything.
    3. Otherwise, start ``make -C ../auth-server dev`` and wait for it.
    """
    skip_server = os.environ.get("SKIP_SERVER_START", "false").lower() == "true"

    existing = _find_running_auth_server()
    if existing:
        print(f"\n✓ Auth-server already running on {existing}, skipping startup")
        yield existing
        return

    if skip_server:
        fallback_url = f"http://localhost:{AUTH_SERVER_DEFAULT_PORT}"
        print(
            "\n⚠️  SKIP_SERVER_START is set and no existing auth-server detected; "
            "returning fallback URL without starting server."
        )
        yield fallback_url
        return

    print("\nStarting auth-server...")
    print("=" * 80)

    server_process = subprocess.Popen(
        ["make", "-C", "../auth-server", "dev"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    server_url = f"http://localhost:{AUTH_SERVER_DEFAULT_PORT}"

    if not _wait_for_auth_server(server_url, timeout=60):
        # Dump whatever output the process produced before failing.
        if server_process.stdout:
            output = server_process.stdout.read()
            if output:
                print(output)
        server_process.kill()
        raise RuntimeError(
            f"Auth-server failed to start on {server_url} within 60 seconds. Check output above for errors."
        )

    print(f"✅ Auth-server is ready on {server_url}")
    print("=" * 80)

    try:
        yield server_url
    finally:
        print("\nStopping auth-server...")
        server_process.terminate()
        try:
            server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            print("⚠️  Auth-server did not exit in time; sending SIGKILL.")
            server_process.kill()
            server_process.wait(timeout=5)
        if server_process.stdout:
            server_process.stdout.close()


@pytest.fixture(scope="session")
def auth_base_url() -> Generator[str, None, None]:
    """Resolve the auth-server base URL.

    If ``AUTH_SERVER_URL`` is set, use that directly (for remote / CI targets).
    Otherwise, start a local auth-server the same way PD/LL servers are started.
    """
    env_url = os.environ.get("AUTH_SERVER_URL")
    if env_url:
        yield env_url
        return

    yield from _start_auth_server()


@pytest.fixture(scope="session")
def auth_client(auth_base_url: str) -> Generator[AuthClient, None, None]:
    """Session-scoped auth-server client.

    The client is shared across all tests in a session so we don't
    open/close connections per test.
    """
    with AuthClient(base_url=auth_base_url) as client:
        yield client


@pytest.fixture()
def admin_token(auth_client: AuthClient) -> TokenResponse:
    """A fresh admin access token for each test that requests it."""
    return auth_client.get_token(ADMIN_USERNAME, ADMIN_PASSWORD)
