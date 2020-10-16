"""Settings unit tests."""

import json
import os
from unittest.mock import patch, MagicMock
import pytest
from _pytest.fixtures import FixtureRequest

from notify_server.settings import Settings


@pytest.fixture
def envvar_patch() -> MagicMock:
    """Patch os.environ."""
    with patch.object(os, "environ", new=dict()) as p:
        yield p


@pytest.fixture
def port() -> int:
    """Port fixture."""
    return 4444


@pytest.fixture
def scheme() -> str:
    """Scheme fixture."""
    return "ftp"


@pytest.fixture
def server_address_override(request: FixtureRequest,
                            envvar_patch: MagicMock,
                            port: int,
                            scheme: str) -> None:
    """Fixture that overrides a server address environment variable."""
    marker = request.node.get_closest_marker("env_var")
    obj = {"scheme": "ftp", "port": 4444}
    envvar_patch[marker.args[0]] = json.dumps(obj)


@pytest.mark.env_var('OT_NOTIFY_SERVER_publisher_address')
def test_override_publisher_address(server_address_override: None,
                                    port: int,
                                    scheme: str) -> None:
    """Test environment var override."""
    s = Settings()
    assert s.publisher_address.port == port
    assert s.publisher_address.scheme == scheme


@pytest.mark.env_var('OT_NOTIFY_SERVER_subscriber_address')
def test_override_subscriber_address(server_address_override: None,
                                     port: int,
                                     scheme: str) -> None:
    """Test environment var override."""
    s = Settings()
    assert s.subscriber_address.port == port
    assert s.subscriber_address.scheme == scheme
