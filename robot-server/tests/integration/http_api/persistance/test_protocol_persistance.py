from pathlib import Path
import secrets
from typing import IO, Callable

import pytest

from tests.integration.dev_server import DevServer
from tests.integration.http_robot import HttpRobot
from tests.integration.protocol_files import get_py_protocol, get_json_protocol


@pytest.mark.parametrize("protocol", [(get_py_protocol), (get_json_protocol)])
def test_protocols_persist(protocol: Callable[[str], IO[bytes]]) -> None:
    """Test that json and python protocols are persisted through dev server restart."""
    port = "15555"
    server = DevServer(port=port)
    robot = HttpRobot(host="http://localhost", port=port)
    if robot.alive():
        assert False, "A dev robot may NOT already be running when this test runs."
    server.start()
    assert robot.wait_until_alive(6), "Dev Robot never became available."
    protocols_to_create = 13
    for _ in range(protocols_to_create):
        file = protocol(secrets.token_urlsafe(16))
        robot.post_protocol([Path(file.name)])
        file.close()
    server.stop()
    assert robot.wait_until_dead(12), "Dev Robot did not stop."
    server.start()
    assert robot.wait_until_alive(6), "Dev Robot never became available."
    response = robot.get_protocols()
    # THE actual test step!
    assert len(response.json()["data"]) == protocols_to_create
    server.stop()
