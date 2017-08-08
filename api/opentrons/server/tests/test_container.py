import os
import pytest

from opentrons.server import robot_container
from opentrons.util.trace import EventBroker


protocol_text = None
protocol_file = os.path.join(
        os.path.dirname(__file__), 'data', 'dinosaur.py')

with open(protocol_file) as file:
    protocol_text = ''.join(list(file))


def test_load_from_text():
    rc = robot_container.RobotContainer()
    robot = rc.load_protocol(protocol_text)
    assert len(robot.commands()) == 101


def test_load_from_file():
    rc = robot_container.RobotContainer()
    robot = rc.load_protocol_file(protocol_file)
    assert len(robot.commands()) == 101


@pytest.mark.asyncio
async def test_async_notifications():
    rc = robot_container.RobotContainer()
    EventBroker.get_instance().notify({'foo': 'bar'})
    # Try getting async iterator
    aiter = rc.__aiter__()
    # Then read the first item
    res = await aiter.__anext__()
    assert res == {'foo': 'bar'}
