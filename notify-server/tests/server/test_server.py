"""Server module unit tests."""

import pytest

from notify_server.server import server
from notify_server.settings import ServerBindAddress


@pytest.mark.parametrize(argnames=["address", "expected"],
                         argvalues=[
                             [ServerBindAddress(scheme="tcp", port=1234),
                              "tcp://*:1234"],
                             [ServerBindAddress(scheme="ipc", port=4),
                              "ipc://*:4"]])
def test_to_zmq_address(address: ServerBindAddress, expected: str) -> None:
    """Test creation of zmq host address from settings."""
    assert server._to_zmq_address(address) == expected
