import time
from typing import Generator

import pytest
import requests

from server_utils.auth.scopes import serialize_scopes
from tests.dev_server import DevServer

from auth_server.users.models import ACCOUNT_TYPE_TO_SCOPES, AccountType

_INTEGRATION_SERVER_STARTUP_TIMEOUT_S = 30


@pytest.fixture
def admin_scopes_str() -> str:
    """All the OAuth 2 scopes that an admin should have, as a space-separated string."""
    return serialize_scopes(set(ACCOUNT_TYPE_TO_SCOPES[AccountType.ADMIN]))


@pytest.fixture
def user_scopes_str() -> str:
    """All the OAuth 2 scopes that a regular user should have, as a space-separated string."""
    return serialize_scopes(set(ACCOUNT_TYPE_TO_SCOPES[AccountType.USER]))


@pytest.fixture
def admin_scopes_list() -> list[str]:
    """All the OAuth 2 scopes that an admin should have, as a list."""
    return sorted(scope.api_name for scope in ACCOUNT_TYPE_TO_SCOPES[AccountType.ADMIN])


@pytest.fixture
def user_scopes_list() -> list[str]:
    """All the OAuth 2 scopes that a regular user should have, as a list."""
    return sorted(scope.api_name for scope in ACCOUNT_TYPE_TO_SCOPES[AccountType.USER])


@pytest.fixture
def run_server(unused_tcp_port: int) -> Generator[DevServer, None, None]:
    """Run a dev server as a fixture scoped to the test."""
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
