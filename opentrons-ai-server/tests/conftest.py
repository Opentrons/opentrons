from typing import Generator

import pytest

from tests.helpers.client import Client
from tests.helpers.settings import get_settings


def pytest_addoption(parser: pytest.Parser) -> None:
    """Add an option to pytest command-line parser to specify the environment."""
    parser.addoption("--env", action="store", default="sandbox", help="Set the environment for the tests (dev, sandbox, staging, prod)")


@pytest.fixture(scope="session")
def env(request: pytest.FixtureRequest) -> str:
    """A fixture to access the environment argument value."""
    return str(request.config.getoption("--env"))


@pytest.fixture(scope="session")
def client(env: str) -> Generator[Client, None, None]:
    """Fixture to initialize and tear down the client for API interaction."""
    settings = get_settings(env=env)
    client = Client(settings)
    yield client
    client.close()
