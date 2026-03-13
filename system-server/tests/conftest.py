import time
from pathlib import Path
from typing import Generator

import pytest
import requests
from sqlalchemy.engine import Engine as SQLEngine

from .dev_server import DevServer
from system_server.persistence.database import create_sql_engine

_INTEGRATION_SERVER_STARTUP_TIMEOUT_S = 30


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
def sql_engine(tmpdir: Path) -> Generator[SQLEngine, None, None]:
    """Return a set-up database to back the store."""
    db_file_path = tmpdir / "test.db"
    sql_engine = create_sql_engine(db_file_path)
    yield sql_engine
    sql_engine.dispose()


@pytest.fixture
def run_server(unused_tcp_port: int) -> Generator[DevServer, None, None]:
    """Run the system server as a subprocess."""
    with DevServer(port=unused_tcp_port) as dev_server:
        print("Starting server")
        dev_server.start()
        base_url = f"http://localhost:{dev_server.port}"
        _wait_until_ready(base_url)
        print("server started")
        yield dev_server


def _wait_until_ready(base_url: str) -> None:
    with requests.Session() as requests_session:
        started = time.monotonic()
        while True:
            now = time.monotonic()
            if now - started > _INTEGRATION_SERVER_STARTUP_TIMEOUT_S:
                raise RuntimeError("Could not start dev server")
            try:
                health_response = requests_session.get(f"{base_url}/health")
            except requests.ConnectionError:
                # The server isn't up yet to accept requests. Keep polling.
                pass
            else:
                if health_response.status_code == 503:
                    # The server is accepting requests but reporting not ready. Keep polling.
                    pass
                else:
                    # The server's replied with something other than a busy indicator. Stop polling.
                    return

            time.sleep(0.1)
