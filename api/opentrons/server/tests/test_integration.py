from opentrons.server import rpc


async def test_notifications(session, robot_container, protocol):
    session.server.root = robot_container
    await session.socket.receive_json()  # Skip init

    await session.call(session.server.control, 'get_root', [])
    await session.socket.receive_json()  # Skip ack
    await session.socket.receive_json()  # Get call result

    await session.call(
        session.server.root,
        'load_protocol',
        [protocol.text, protocol.filename]
    )

    await session.socket.receive_json()  # Skip ack
    await session.socket.receive_json()  # Skip result

    await session.call(
        session.server.root,
        'run',
        []
    )
    await session.socket.receive_json()  # Skip ack

    responses = []

    while True:
        res = await session.socket.receive_json()
        if (res['$']['type'] == rpc.CALL_RESULT_MESSAGE):
            break

        responses.append(res)

    assert all([
        res['$']['type'] == rpc.NOTIFICATION_MESSAGE for res in responses])
