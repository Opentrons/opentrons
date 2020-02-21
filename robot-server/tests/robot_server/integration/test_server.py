import pytest
import logging
from robot_server.aiohttp import rpc
# TODO: Modify test protocols to get a Well to use the `wells` method


# Setting root to None tells session to use session_manager as root
@pytest.mark.api1_only
@pytest.mark.parametrize('root', [None])
async def test_notifications(session, session_manager, protocol, root, connect, caplog):  # noqa
    caplog.set_level(logging.INFO)
    root = session_manager

    await session.socket.receive_json()  # Skip init
    await session.call(
        id=id(root),
        name='create',
        args=[protocol.filename, protocol.text]
    )

    res = await session.socket.receive_json()  # Skip ack

    res = await session.socket.receive_json()  # Get notification
    assert res['$']['type'] == rpc.NOTIFICATION_MESSAGE
    assert res['data']['v']['payload']['v']['state'] == 'loaded'

    res = await session.socket.receive_json()  # Get call result

    await session.call(
        id=res['data']['i'],
        name='run',
        args=[]
    )
    await session.socket.receive_json()  # Skip ack

    # Create another connection to use throughout the test
    socket = await connect()
    # Receive control message
    res = await socket.receive_json()
    assert res['$']['type'] == rpc.CONTROL_MESSAGE

    responses = []
    while True:
        # NOTE: we are using a second socket from here onwards
        res = await socket.receive_json()
        if (res['$']['type'] == rpc.CALL_RESULT_MESSAGE):
            break
        responses.append(res)

    assert all([
        res['$']['type'] == rpc.NOTIFICATION_MESSAGE for res in responses])

    await session.call(
        id=id(root),
        name='get_session',
        args=[]
    )

    await socket.receive_json()  # Skip ack
    res = await socket.receive_json()

    assert len(res['data']['v']['command_log']['v']) == 75

    states = [
        response['data']['v']['payload']['v']['state']
        for response in responses]

    assert states[0] == 'running', \
        'First state is "running"'
    assert states[-1] == 'finished', \
        'Last state is "finished"'
