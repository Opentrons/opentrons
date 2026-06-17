import asyncio
import threading
import time
from pathlib import Path
from typing import Callable, Generator

import aiohttp.web
import pytest
import requests
from sqlalchemy.engine import Engine as SQLEngine

from tests.dev_server import DevServer

from audit_server.persistence.database import create_schema, sql_engine_ctx

_INTEGRATION_SERVER_STARTUP_TIMEOUT_S = 30


@pytest.fixture
def db_engine(tmp_path: Path) -> Generator[SQLEngine, None, None]:
    """A SQLAlchemy engine backed by a fresh SQLite DB with the schema created."""
    db_path = tmp_path / "test_audit.db"
    with sql_engine_ctx(db_path) as engine:
        create_schema(engine)
        yield engine


@pytest.fixture(autouse=True)
def configure_test_logs(caplog: pytest.LogCaptureFixture) -> None:
    """Configure which logs pytest captures and displays.

    Because of the autouse=True, this automatically applies to each test.

    By default, pytest displays log messages of level WARNING and above.
    If you need to adjust this in the course of a debugging adventure,
    you should normally do it by passing something like --log-level=DEBUG
    to pytest on the command line.
    """
    # Fix up SQLAlchemy's logging so that it uses the same log level as everything else.
    # By default, SQLAlchemy's logging is slightly unusual: it hides messages below
    # WARNING, even if you pass --log-level=DEBUG to pytest on the command line.
    # See: https://docs.sqlalchemy.org/en/14/core/engines.html#configuring-logging
    caplog.set_level("NOTSET", logger="sqlalchemy")


@pytest.fixture
def fake_key_server(
    unused_tcp_port_factory: Callable[[], int],
) -> Generator[str, None, None]:
    """Run a minimal in-process stand-in for key-server on a TCP port.

    Yields the base URL (e.g. ``http://localhost:12345``) that audit-server
    can use to reach this fake. The fake responds to
    ``POST /keys/internal/logSigning/signMessage`` with a canned signature
    so tests don't have to depend on a real key-server being running.
    """
    port = unused_tcp_port_factory()

    async def sign_message(request: aiohttp.web.Request) -> aiohttp.web.Response:
        body = await request.json()
        message = body["data"]["message"]
        return aiohttp.web.json_response(
            data={
                "data": {
                    "message": message,
                    "messageHash": "sha256:ZmFrZQ==",
                    "messageSignature": "ed25519:ZmFrZQ==",
                    "signatureVersion": 1,
                }
            }
        )

    app = aiohttp.web.Application()
    app.router.add_post("/keys/internal/logSigning/signMessage", sign_message)

    loop = asyncio.new_event_loop()
    runner = aiohttp.web.AppRunner(app)

    def serve() -> None:
        asyncio.set_event_loop(loop)
        loop.run_until_complete(runner.setup())
        site = aiohttp.web.TCPSite(runner, host="127.0.0.1", port=port)
        loop.run_until_complete(site.start())
        loop.run_forever()

    thread = threading.Thread(target=serve, name="fake-key-server", daemon=True)
    thread.start()

    base_url = f"http://127.0.0.1:{port}"
    _wait_for_tcp(base_url)
    try:
        yield base_url
    finally:
        loop.call_soon_threadsafe(loop.stop)
        thread.join(timeout=5)
        asyncio.run(runner.cleanup())


@pytest.fixture
def run_server(
    unused_tcp_port: int, fake_key_server: str
) -> Generator[DevServer, None, None]:
    """Run a dev server as a fixture scoped to the test.

    The dev server is configured to talk to the in-process ``fake_key_server``
    so that routes that depend on the key-server client resolve cleanly.
    """
    extra_env = {"OT_AUDIT_SERVER_key_server_url": fake_key_server}
    with DevServer(port=unused_tcp_port, extra_env=extra_env) as dev_server:
        dev_server.start()
        base_url = f"http://localhost:{dev_server.port}"
        _wait_until_ready(base_url)
        yield dev_server


def _wait_until_ready(base_url: str) -> None:
    with requests.Session() as requests_session:
        started = time.monotonic()
        while True:
            now = time.monotonic()
            if now - started > _INTEGRATION_SERVER_STARTUP_TIMEOUT_S:
                raise RuntimeError("Could not start dev server")
            try:
                requests_session.get(f"{base_url}/audit/external/test")
            except requests.ConnectionError:
                # The server isn't up yet to accept requests. Keep polling.
                pass
            else:
                return

            time.sleep(0.1)


def _wait_for_tcp(base_url: str) -> None:
    with requests.Session() as requests_session:
        started = time.monotonic()
        while True:
            if time.monotonic() - started > _INTEGRATION_SERVER_STARTUP_TIMEOUT_S:
                raise RuntimeError(f"fake key-server at {base_url} did not come up")
            try:
                requests_session.get(base_url)
            except requests.ConnectionError:
                time.sleep(0.05)
            else:
                return
