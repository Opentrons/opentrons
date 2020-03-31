from unittest.mock import patch
from robot_server.service import dependencies


@patch("robot_server.service.dependencies.get_hardware")
def test_rpc_server_singleton(mock_get_hardware, loop):
    async def get_hardware():
        return {}

    mock_get_hardware.side_effect = get_hardware
    x = loop.run_until_complete(dependencies.get_rpc_server())
    y = loop.run_until_complete(dependencies.get_rpc_server())
    assert x == y
    assert x == dependencies._rpc_server_instance
