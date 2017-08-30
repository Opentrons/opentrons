from opentrons.util.trace import EventBroker
from datetime import datetime
import pytest


async def test_load_from_text(robot_container, protocol):
    session = robot_container.load_protocol(protocol.text, '<blank>')
    assert session.name == '<blank>'
    assert len(session.commands) == 101


async def test_load_from_file(robot_container, protocol):
    session = robot_container.load_protocol_file(protocol.filename)
    assert session.name == protocol.filename
    assert len(session.commands) == 101


async def test_async_notifications(robot_container):
    robot_container.update_filters(['bar'])
    EventBroker.get_instance().notify({'name': 'bar'})
    # Get async iterator
    aiter = robot_container.__aiter__()
    # Then read the first item
    res = await aiter.__anext__()
    # Returns tuple containing message and session
    # Since protocol hasn't been loaded, session is None
    assert res == ({'name': 'bar'}, None)


async def test_load_protocol_with_error(robot_container):
    with pytest.raises(Exception) as e:
        session = robot_container.load_protocol('blah', '<blank>')
        assert session is None

    timestamp, error = e.value.args
    exception, trace = error

    assert datetime.strptime(timestamp, '%Y-%m-%dT%H:%M:%S.%f')
    assert type(exception) == NameError
    assert str(exception) == "name 'blah' is not defined"


async def test_load_and_run(robot_container, protocol):
    session = robot_container.load_protocol_file(protocol.filename)
    assert session.run_log == []
    robot_container.run(devicename='Virtual Smoothie')
    assert len(session.run_log) == 101
