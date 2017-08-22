import os
from opentrons.util.trace import EventBroker

protocol_text = None
protocol_file = os.path.join(
        os.path.dirname(__file__), 'data', 'dinosaur.py')

with open(protocol_file) as file:
    protocol_text = ''.join(list(file))


async def test_load_from_text(robot_container):
    robot_container.reset()
    robot = robot_container.load_protocol(protocol_text)
    assert len(robot.commands()) == 101


async def test_load_from_file(robot_container):
    robot_container.reset()
    robot = robot_container.load_protocol_file(protocol_file)
    assert len(robot.commands()) == 101


async def test_async_notifications(robot_container):
    EventBroker.get_instance().notify({'foo': 'bar'})
    # Try getting async iterator
    aiter = robot_container.__aiter__()
    # Then read the first item
    res = await aiter.__anext__()
    assert res == {'foo': 'bar'}
