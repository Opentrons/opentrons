from opentrons.util.trace import EventBroker


async def test_load_from_text(robot_container, protocol):
    robot = robot_container.load_protocol(protocol.text, '<blank>')
    assert len(robot.commands()) == 101


async def test_load_from_file(robot_container, protocol):
    robot = robot_container.load_protocol_file(protocol.filename)
    assert len(robot.commands()) == 101


async def test_async_notifications(robot_container):
    robot_container.update_filters(['bar'])
    EventBroker.get_instance().notify({'name': 'bar'})
    # Try getting async iterator
    aiter = robot_container.__aiter__()
    # Then read the first item
    res = await aiter.__anext__()
    assert res == {'name': 'bar'}
