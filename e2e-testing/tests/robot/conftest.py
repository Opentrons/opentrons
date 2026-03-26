"""Fixtures for robot-server HTTP smoke tests."""

from __future__ import annotations

import json
import os
import subprocess
import tempfile
import time
import urllib.request
from collections.abc import AsyncGenerator, Generator

import pytest

from automation.clients.auth import ADMIN_PASSWORD, ADMIN_USERNAME, AuthClient, TokenResponse
from automation.clients.robot import DEFAULT_ROBOT_SERVER_PORT, RobotClient

ROBOT_SERVER_PORTS = [DEFAULT_ROBOT_SERVER_PORT]
AUTH_SERVER_DEFAULT_PORT = 33950
AUTH_SERVER_PORTS = [AUTH_SERVER_DEFAULT_PORT]
FLEX_ROBOT_MODEL = "OT-3 Standard"


def _get_robot_server_health(url: str, timeout: int = 2) -> dict[str, object] | None:
    """Fetch `/health` from robot-server, returning parsed JSON when available."""
    try:
        request = urllib.request.Request(
            f"{url}/health",
            headers={"Opentrons-Version": "*"},
        )
        with urllib.request.urlopen(request, timeout=timeout) as response:
            if response.status != 200:
                return None
            return json.loads(response.read().decode("utf-8"))
    except Exception:
        return None


def _get_robot_server_model(url: str, timeout: int = 2) -> str | None:
    """Return the robot model reported by `/health`, if available."""
    health = _get_robot_server_health(url, timeout=timeout)
    robot_model = health.get("robot_model") if health is not None else None
    return robot_model if isinstance(robot_model, str) else None


def _is_robot_server_running(url: str, timeout: int = 2) -> bool:
    """Check if the robot-server is responding at *url*."""
    return _get_robot_server_health(url, timeout=timeout) is not None


def _find_running_robot_server(required_model: str | None = None) -> str | None:
    """Return the URL of a running robot-server, optionally filtered by model."""
    for port in ROBOT_SERVER_PORTS:
        url = f"http://localhost:{port}"
        robot_model = _get_robot_server_model(url)
        if robot_model is None:
            continue
        if required_model is not None and robot_model != required_model:
            continue
        return url
    return None


def _find_running_robot_server_with_wrong_model(required_model: str) -> tuple[str, str] | None:
    """Return a running robot-server URL and model when the model does not match."""
    for port in ROBOT_SERVER_PORTS:
        url = f"http://localhost:{port}"
        robot_model = _get_robot_server_model(url)
        if robot_model is None:
            continue
        if robot_model != required_model:
            return (url, robot_model)
    return None


def _wait_for_robot_server(
    url: str,
    timeout: int = 90,
    required_model: str | None = None,
) -> bool:
    """Block until the robot-server at *url* starts responding with the expected model."""
    start = time.monotonic()
    while time.monotonic() - start < timeout:
        robot_model = _get_robot_server_model(url)
        if robot_model is not None and (required_model is None or robot_model == required_model):
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
    """Start or reuse a local auth-server for auth-enabled robot HTTP smoke tests."""
    existing = _find_running_auth_server()
    if existing:
        print(f"\n✓ Auth-server already running on {existing}, skipping startup")
        yield existing
        return

    skip_server = os.environ.get("SKIP_SERVER_START", "false").lower() == "true"
    if skip_server:
        fallback_url = f"http://localhost:{AUTH_SERVER_DEFAULT_PORT}"
        print(
            "\n⚠️  SKIP_SERVER_START is set and no existing auth-server detected; "
            "returning fallback URL without starting server."
        )
        yield fallback_url
        return

    print("\nStarting auth-server for robot tests...")
    print("=" * 80)

    server_url = f"http://localhost:{AUTH_SERVER_DEFAULT_PORT}"
    with tempfile.TemporaryDirectory() as auth_server_log_dir:
        auth_server_log_path = os.path.join(auth_server_log_dir, "auth-server.log")
        with open(auth_server_log_path, "w+", encoding="utf-8") as auth_server_log:
            server_process = subprocess.Popen(
                [
                    "uv",
                    "run",
                    "--python",
                    "3.12",
                    "python",
                    "-m",
                    "auth_server",
                    "--port",
                    str(AUTH_SERVER_DEFAULT_PORT),
                    "--log-level=debug",
                ],
                cwd="../auth-server",
                stdin=subprocess.DEVNULL,
                stdout=auth_server_log,
                stderr=auth_server_log,
            )

            if not _wait_for_auth_server(server_url, timeout=60):
                server_process.terminate()
                try:
                    server_process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    server_process.kill()
                    server_process.wait(timeout=5)
                auth_server_log.seek(0)
                output = auth_server_log.read()
                if output:
                    print(output)
                raise RuntimeError(f"Auth-server failed to start on {server_url} within 60 seconds.")

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


def _start_robot_server(auth_server_url: str | None) -> Generator[str, None, None]:
    """Start or reuse a local Flex robot-server, enabling auth when an auth URL is available."""
    skip_server = os.environ.get("SKIP_SERVER_START", "false").lower() == "true"
    required_model = FLEX_ROBOT_MODEL

    existing = _find_running_robot_server(required_model=required_model)
    if existing:
        print(f"\n✓ Robot-server already running on {existing}, skipping startup")
        yield existing
        return

    wrong_model_server = _find_running_robot_server_with_wrong_model(required_model)
    if wrong_model_server is not None:
        url, robot_model = wrong_model_server
        raise RuntimeError(
            "A robot-server is already running on "
            f"{url} with model {robot_model!r}, but robot HTTP smoke tests now require "
            f"{required_model!r}. Stop the existing server or point ROBOT_SERVER_URL to a Flex robot-server."
        )

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

    server_url = f"http://localhost:{DEFAULT_ROBOT_SERVER_PORT}"
    with tempfile.TemporaryDirectory() as ot_api_config_dir, tempfile.TemporaryDirectory() as persistence_directory:
        server_log_path = os.path.join(persistence_directory, "robot-server.log")
        env = dict(os.environ)
        env.update(
            {
                "OT_ROBOT_SERVER_DOT_ENV_PATH": "dev-flex.env",
                "OT_API_CONFIG_DIR": ot_api_config_dir,
                "OT_ROBOT_SERVER_persistence_directory": persistence_directory,
            }
        )
        if auth_server_url is not None:
            env["OT_ROBOT_SERVER_auth_server_url"] = auth_server_url
        with open(server_log_path, "w+", encoding="utf-8") as server_log:
            server_process = subprocess.Popen(
                [
                    "uv",
                    "run",
                    "uvicorn",
                    "robot_server.app:app",
                    "--host",
                    "localhost",
                    "--port",
                    str(DEFAULT_ROBOT_SERVER_PORT),
                    "--ws",
                    "wsproto",
                ],
                cwd="../robot-server",
                stdin=subprocess.DEVNULL,
                stdout=server_log,
                stderr=server_log,
                env=env,
            )

            if not _wait_for_robot_server(server_url, timeout=90, required_model=required_model):
                server_process.terminate()
                try:
                    server_process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    server_process.kill()
                    server_process.wait(timeout=5)
                server_log.seek(0)
                output = server_log.read()
                if output:
                    print(output)
                raise RuntimeError(
                    f"Robot-server failed to start on {server_url} as {required_model!r} within 90 seconds."
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


@pytest.fixture(scope="session")
def robot_auth_base_url() -> Generator[str | None, None, None]:
    """Resolve the auth-server URL used to keep robot HTTP smoke tests auth-enabled."""
    env_url = os.environ.get("ROBOT_AUTH_SERVER_URL") or os.environ.get("AUTH_SERVER_URL")
    if env_url:
        yield env_url.rstrip("/")
        return

    yield from _start_auth_server()


@pytest.fixture(scope="session")
def robot_base_url(robot_auth_base_url: str | None) -> Generator[str, None, None]:
    """Resolve the robot-server URL, auto-starting a local auth-enabled dev server when needed."""
    env_url = os.environ.get("ROBOT_SERVER_URL")
    if env_url:
        yield env_url.rstrip("/")
        return

    yield from _start_robot_server(robot_auth_base_url)


@pytest.fixture(scope="session")
async def robot_client(robot_base_url: str) -> AsyncGenerator[RobotClient, None]:
    """Session-scoped robot-server client."""
    async with RobotClient(base_url=robot_base_url) as client:
        yield client


@pytest.fixture(scope="session")
async def robot_access_token(robot_auth_base_url: str | None) -> TokenResponse | None:
    """Fetch an auth token and enable access control for local robot smoke tests."""
    if robot_auth_base_url is None:
        return None
    async with AuthClient(base_url=robot_auth_base_url) as auth_client:
        token = await auth_client.get_token(ADMIN_USERNAME, ADMIN_PASSWORD)
        settings = await auth_client.get_settings()
        access_control_enabled = settings.get("data", {}).get("accessControlEnabled")
        if access_control_enabled is not True and not (
            os.environ.get("ROBOT_AUTH_SERVER_URL") or os.environ.get("AUTH_SERVER_URL")
        ):
            await auth_client.patch_settings(
                {"accessControlEnabled": True},
                token=token,
            )
        return token
