"""Fixtures for system-server E2E tests."""

from __future__ import annotations

import os
import subprocess
import time
import urllib.request
from collections.abc import AsyncGenerator, Generator

import pytest

from automation.clients.system import (
    DEFAULT_SYSTEM_SERVER_PORT,
    SystemClient,
)

SYSTEM_SERVER_PORTS = [DEFAULT_SYSTEM_SERVER_PORT]


def _is_system_server_running(url: str, timeout: int = 2) -> bool:
    """Check if the system-server is responding at *url*.

    We probe GET /system/connected because it is a cheap endpoint that
    does not require authentication.
    """
    try:
        urllib.request.urlopen(f"{url}/system/connected", timeout=timeout)
        return True
    except Exception:
        return False


def _find_running_system_server() -> str | None:
    """Return the URL of a running system-server, or None."""
    for port in SYSTEM_SERVER_PORTS:
        url = f"http://localhost:{port}"
        if _is_system_server_running(url):
            return url
    return None


def _wait_for_system_server(url: str, timeout: int = 60) -> bool:
    """Block until the system-server at *url* starts responding."""
    start = time.monotonic()
    while time.monotonic() - start < timeout:
        if _is_system_server_running(url):
            return True
        time.sleep(1)
    return False


def _start_system_server() -> Generator[str, None, None]:
    """Start or reuse a local system-server.

    1. If the server is already running, reuse it.
    2. If SKIP_SERVER_START is set, yield the fallback URL without starting.
    3. Otherwise, start make -C ../system-server dev and wait for it.
    """
    skip_server = os.environ.get("SKIP_SERVER_START", "false").lower() == "true"

    existing = _find_running_system_server()
    if existing:
        print(f"\n✓ System-server already running on {existing}, skipping startup")
        yield existing
        return

    if skip_server:
        fallback_url = f"http://localhost:{DEFAULT_SYSTEM_SERVER_PORT}"
        print(
            "\n⚠️  SKIP_SERVER_START is set and no existing system-server detected; "
            "returning fallback URL without starting server."
        )
        yield fallback_url
        return

    print("\nStarting system-server...")
    print("=" * 80)

    env = {
        **os.environ,
        "OT_SYSTEM_SERVER_persistence_directory": "automatically_make_temporary",
    }
    server_process = subprocess.Popen(
        ["make", "-C", "../system-server", "dev"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=env,
    )

    server_url = f"http://localhost:{DEFAULT_SYSTEM_SERVER_PORT}"

    if not _wait_for_system_server(server_url, timeout=60):
        if server_process.stdout:
            output = server_process.stdout.read()
            if output:
                print(output)
        server_process.kill()
        raise RuntimeError(
            f"System-server failed to start on {server_url} within 60 seconds. Check output above for errors."
        )

    print(f"✅ System-server is ready on {server_url}")
    print("=" * 80)

    try:
        yield server_url
    finally:
        print("\nStopping system-server...")
        server_process.terminate()
        try:
            server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            print("⚠️  System-server did not exit in time; sending SIGKILL.")
            server_process.kill()
            server_process.wait(timeout=5)
        if server_process.stdout:
            server_process.stdout.close()


@pytest.fixture(scope="session")
def system_base_url() -> Generator[str, None, None]:
    """Resolve the system-server base URL.

    If SYSTEM_SERVER_URL is set, use that. Otherwise start a local
    system-server.
    """
    env_url = os.environ.get("SYSTEM_SERVER_URL")
    if env_url:
        yield env_url
        return

    yield from _start_system_server()


@pytest.fixture(scope="session")
async def system_client(system_base_url: str) -> AsyncGenerator[SystemClient, None]:
    """Session-scoped system-server client."""
    async with SystemClient(base_url=system_base_url) as client:
        yield client


@pytest.fixture()
async def oem_mode_disabled(system_client: SystemClient) -> AsyncGenerator[None, None]:
    """Ensure OEM mode is disabled before and after a test."""
    await system_client.enable_oem_mode(False)
    try:
        yield
    finally:
        await system_client.enable_oem_mode(False)
