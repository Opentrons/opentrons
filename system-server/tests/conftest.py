from pathlib import Path
from typing import Generator

import pytest
import requests
from sqlalchemy.engine import Engine as SQLEngine

from .dev_server import DevServer
from system_server.persistence.database import create_sql_engine


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
def run_server() -> Generator[DevServer, None, None]:
    """Run the system server as a subprocess."""
    server = DevServer()
    server.start()

    with requests.Session() as session:
        print("Starting server")
        while True:
            try:
                session.get(f"http://localhost:{server.port}")
            except requests.exceptions.ConnectionError:
                pass
            else:
                break
        print("server started")

    yield server
    print("stopping server")
    server.stop()
    print("server stopped")
