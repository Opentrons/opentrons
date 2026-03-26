"""Fixtures for robot-server HTTP smoke tests."""

from __future__ import annotations

import os
import subprocess
import time
import urllib.request
from collections.abc import Generator

import pytest

from automation.clients.auth import ADMIN_PASSWORD, ADMIN_USERNAME, AuthClient, TokenResponse
from automation.clients.robot import DEFAULT_ROBOT_SERVER_PORT, RobotClient

ROBOT_SERVER_PORTS = [DEFAULT_ROBOT_SERVER_PORT]
AUTH_SERVER_DEFAULT_PORT = 33950
AUTH_SERVER_PORTS = [AUTH_SERVER_DEFAULT_PORT]


def _is_robot_server_running(url: str, timeout: int = 2) -> bool:
    """Check if the robot-server is responding at *url*."""
    try:
        urllib.request.urlopen(f"{url}/openapi.json", timeout=timeout)
        return True
    except Exception:
        return False


def _find_running_robot_server() -> str | None:
    """Return the URL of a running robot-server, or None."""
    for port in ROBOT_SERVER_PORTS:
        url = f"http://localhost:{port}"
        if _is_robot_server_running(url):
            return url
    return None


def _wait_for_robot_server(url: str, timeout: int = 90) -> bool:
    """Block until the robot-server at *url* starts responding."""
    start = time.monotonic()
    while time.monotonic() - start < timeout:
        if _is_robot_server_running(url):
            return True
        time.sleep(1)
    return False


def _is_auth_server_running(url: str, timeout: int = 2) -> bool:
    """Check if the auth-server is responding at *url*."""
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
    """Start or reuse a local auth-server for robot token tests."""
    existing = _find_running_auth_server()
    if existing:
        print(f"\n✓ Auth-server already running on {existing}, skipping startup")
        yield existing
        return

    print("\nStarting auth-server for robot tests...")
    print("=" * 80)

    server_process = subprocess.Popen(
        ["make", "-C", "../auth-server", "dev"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    server_url = f"http://localhost:{AUTH_SERVER_DEFAULT_PORT}"
    if not _wait_for_auth_server(server_url, timeout=60):
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


def _start_robot_server(auth_server_url: str | None = None) -> Generator[str, None, None]:
    """Start or reuse a local robot-server."""
    skip_server = os.environ.get("SKIP_SERVER_START", "false").lower() == "true"

    existing = _find_running_robot_server()
    if existing:
        print(f"\n✓ Robot-server already running on {existing}, skipping startup")
        yield existing
        return

    if skip_server:
        fallback_url = f"http://localhost:{DEFAULT_ROBOT_SERVER_PORT}"
        print(
            "\n⚠️  SKIP_SERVER_START is set and no existing robot-server detected; "
            "returning fallback URL without starting server."
        )
        yield fallback_url
        return

    print("\nStarting robot-server...")
    print("=" * 80)

    env = dict(os.environ)
    if auth_server_url is not None:
        env["OT_ROBOT_SERVER_auth_server_url"] = auth_server_url

    server_process = subprocess.Popen(
        ["make", "-C", "../robot-server", "dev"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=env,
    )

    server_url = f"http://localhost:{DEFAULT_ROBOT_SERVER_PORT}"
    if not _wait_for_robot_server(server_url, timeout=90):
        server_process.terminate()
        try:
            server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server_process.kill()
            server_process.wait(timeout=5)
        if server_process.stdout:
            output = server_process.stdout.read()
            if output:
                print(output)
        raise RuntimeError(
            f"Robot-server failed to start on {server_url} within 90 seconds. Check output above for errors."
        )

    print(f"✅ Robot-server is ready on {server_url}")
    print("=" * 80)

    try:
        yield server_url
    finally:
        print("\nStopping robot-server...")
        server_process.terminate()
        try:
            server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            print("⚠️  Robot-server did not exit in time; sending SIGKILL.")
            server_process.kill()
            server_process.wait(timeout=5)
        if server_process.stdout:
            server_process.stdout.close()


@pytest.fixture(scope="session")
def robot_auth_base_url() -> Generator[str, None, None]:
    """Resolve the auth-server URL used by robot token tests."""
    env_url = os.environ.get("ROBOT_AUTH_SERVER_URL") or os.environ.get("AUTH_SERVER_URL")
    if env_url:
        yield env_url.rstrip("/")
        return

    yield from _start_auth_server()


@pytest.fixture(scope="session")
def robot_base_url(robot_auth_base_url: str) -> Generator[str, None, None]:
    """Resolve the robot-server URL, auto-starting a local dev server when needed."""
    env_url = os.environ.get("ROBOT_SERVER_URL")
    if env_url:
        yield env_url.rstrip("/")
        return

    yield from _start_robot_server(auth_server_url=robot_auth_base_url)


@pytest.fixture(scope="session")
def robot_client(robot_base_url: str) -> Generator[RobotClient, None, None]:
    """Session-scoped robot-server client."""
    with RobotClient(base_url=robot_base_url) as client:
        yield client


@pytest.fixture(scope="session")
def robot_access_token(robot_auth_base_url: str) -> TokenResponse:
    """Fetch an auth token for robot smoke tests."""
    with AuthClient(base_url=robot_auth_base_url) as auth_client:
        return auth_client.get_token(ADMIN_USERNAME, ADMIN_PASSWORD)
