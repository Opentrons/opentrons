"""Start and stop the Flex auth-server for component (HTTP) tests.

This module starts the server with the auth-server Makefile target
``dev-no-reload`` (``make -C <monorepo>/auth-server dev-no-reload ...``), the
same toolchain as ``make -C auth-server dev`` but without uvicorn ``--reload``
so pytest owns a single stable process.

Environment:

* ``E2E_AUTH_SERVER_PORT`` (default ``33950``): listen port on ``127.0.0.1``.
* ``SKIP_AUTH_SERVER_START`` (``true`` / ``1``): do not spawn a process; use an
  already-running server at the base URL or skip if nothing responds.
* ``OT_AUTH_SERVER_*``: forwarded to the child process; this runner always sets
  ``OT_AUTH_SERVER_persistence_directory`` to a fresh temp directory per session
  so tests get an isolated SQLite database unless you override it in the env
  before starting pytest.
"""

from __future__ import annotations

import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from collections.abc import Generator
from pathlib import Path

_AUTH_SETTINGS_PATH = "/auth/settings"


def monorepo_root() -> Path:
    """Return the opentrons monorepo root (parent of ``e2e-testing``)."""

    return Path(__file__).resolve().parents[2]


def auth_server_project_dir() -> Path:
    """Return the ``auth-server`` package directory inside the monorepo."""

    return monorepo_root() / "auth-server"


def auth_settings_http_url(base_url: str) -> str:
    """Return the absolute URL for ``GET /auth/settings``."""

    return f"{base_url.rstrip('/')}{_AUTH_SETTINGS_PATH}"


def is_auth_server_http_ready(base_url: str, *, timeout_s: float = 2.0) -> bool:
    """Return True if ``GET /auth/settings`` returns HTTP 200 with a JSON body."""

    url = auth_settings_http_url(base_url)
    try:
        with urllib.request.urlopen(url, timeout=timeout_s) as resp:
            if resp.status != 200:
                return False
            _ = resp.read(64)
            return True
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def wait_for_auth_server_http(base_url: str, *, timeout_s: float = 120.0, interval_s: float = 0.5) -> None:
    """Block until ``is_auth_server_http_ready`` or raise ``RuntimeError``."""

    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline:
        if is_auth_server_http_ready(base_url, timeout_s=min(2.0, interval_s + 0.5)):
            return
        time.sleep(interval_s)
    raise RuntimeError(f"auth-server did not become ready at {auth_settings_http_url(base_url)} within {timeout_s}s")


def wait_for_auth_server_http_or_process_exit(
    base_url: str,
    proc: subprocess.Popen[str],
    *,
    timeout_s: float = 120.0,
    interval_s: float = 0.5,
) -> None:
    """Like ``wait_for_auth_server_http`` but fail fast if *proc* exits early."""

    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline:
        exit_code = proc.poll()
        if exit_code is not None:
            raise RuntimeError(f"auth-server process exited before /auth/settings responded (code {exit_code})")
        if is_auth_server_http_ready(base_url, timeout_s=min(2.0, interval_s + 0.5)):
            return
        time.sleep(interval_s)
    raise RuntimeError(f"auth-server did not become ready at {auth_settings_http_url(base_url)} within {timeout_s}s")


def _terminate_process(proc: subprocess.Popen[str], *, started_new_session: bool) -> None:
    if proc.poll() is not None:
        return
    try:
        if started_new_session and sys.platform != "win32":
            os.killpg(proc.pid, signal.SIGTERM)
        else:
            proc.send_signal(signal.SIGTERM)
    except OSError:
        pass
    try:
        proc.wait(timeout=15)
    except subprocess.TimeoutExpired:
        try:
            if started_new_session and sys.platform != "win32":
                os.killpg(proc.pid, signal.SIGKILL)
            else:
                proc.kill()
        except OSError:
            pass
        proc.wait(timeout=10)


def managed_auth_server_session(
    *,
    port: int | None = None,
    host: str = "127.0.0.1",
) -> Generator[str, None, None]:
    """Session-scoped context: reuse, start, or skip the auth-server; yield ``http://host:port``."""

    resolved_port = port if port is not None else int(os.environ.get("E2E_AUTH_SERVER_PORT", "33950"))
    base_url = f"http://{host}:{resolved_port}"
    skip_raw = os.environ.get("SKIP_AUTH_SERVER_START", "").strip().lower()
    skip_start = skip_raw in {"1", "true", "yes"}

    if is_auth_server_http_ready(base_url):
        yield base_url
        return

    if skip_start:
        raise RuntimeError(
            f"No auth-server at {base_url} and SKIP_AUTH_SERVER_START is set. "
            "Start the server manually or unset SKIP_AUTH_SERVER_START."
        )

    project_dir = auth_server_project_dir()
    if not (project_dir / "pyproject.toml").is_file():
        raise RuntimeError(f"auth-server project not found at {project_dir}")

    persistence = tempfile.mkdtemp(prefix="e2e-auth-server-")
    env = os.environ.copy()
    env["OT_AUTH_SERVER_persistence_directory"] = persistence

    # Makefile variables (dev_port, dev_host, dev_log_level) match auth-server/Makefile.
    cmd = [
        "make",
        "-C",
        str(project_dir),
        "dev-no-reload",
        f"dev_port={resolved_port}",
        f"dev_host={host}",
        "dev_log_level=warning",
    ]
    start_new_session = sys.platform != "win32"
    proc = subprocess.Popen(
        cmd,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        text=True,
        start_new_session=start_new_session,
    )
    try:
        wait_for_auth_server_http_or_process_exit(base_url, proc)
        yield base_url
    finally:
        if proc.poll() is None:
            _terminate_process(proc, started_new_session=start_new_session)
        shutil.rmtree(persistence, ignore_errors=True)
