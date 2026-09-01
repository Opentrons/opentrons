import time
from pathlib import Path
from typing import Generator

import pytest
import requests

from server_utils.auth.scopes import serialize_scopes
from tests.dev_server import DevServer

from auth_server.persistence.file_and_directory_names import (
    DB_FILE,
    LATEST_VERSION_DIRECTORY,
)
from auth_server.settings.models import SettingsResponseData
from auth_server.users.models import (
    AccountType,
)
from auth_server.users.scopes import get_scope_set_of_account_type

_INTEGRATION_SERVER_STARTUP_TIMEOUT_S = 30


@pytest.fixture
def admin_scopes_str() -> str:
    """All the OAuth 2 scopes that an admin should have, as a space-separated string."""
    return serialize_scopes(
        get_scope_set_of_account_type(
            AccountType.ADMIN, SettingsResponseData(), must_reset_password=False
        )
    )


@pytest.fixture
def user_scopes_str() -> str:
    """All the OAuth 2 scopes that a regular user should have, as a space-separated string."""
    return serialize_scopes(
        get_scope_set_of_account_type(
            AccountType.USER, SettingsResponseData(), must_reset_password=False
        )
    )


@pytest.fixture
def auth_persistence_directory(tmp_path: Path) -> Path:
    """Persistence directory shared by the server process and test helpers."""
    persistence_directory = tmp_path / "auth-persist"
    persistence_directory.mkdir()
    return persistence_directory


@pytest.fixture
def auth_db_path(auth_persistence_directory: Path) -> str:
    """Path to the server SQLite database under the test persistence directory."""
    return str(auth_persistence_directory / LATEST_VERSION_DIRECTORY / DB_FILE)


@pytest.fixture
def run_server(
    unused_tcp_port: int,
    auth_persistence_directory: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> Generator[DevServer, None, None]:
    """Run a dev server as a fixture scoped to the test."""
    monkeypatch.setenv(
        "OT_AUTH_SERVER_persistence_directory", str(auth_persistence_directory)
    )
    with DevServer(port=unused_tcp_port) as dev_server:
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
