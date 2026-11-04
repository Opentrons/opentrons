import time
from typing import Generator

import pytest
import requests

from tests.dev_server import DevServer

_INTEGRATION_SERVER_STARTUP_TIMEOUT_S = 30


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
                requests_session.get(f"{base_url}/external/settings")
            except requests.ConnectionError:
                # The server isn't up yet to accept requests. Keep polling.
                pass
            else:
                return

            time.sleep(0.1)
