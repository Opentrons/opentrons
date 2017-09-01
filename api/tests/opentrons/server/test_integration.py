import pytest
from opentrons.server import rpc


# Setting root to None tells session to use session_manager as root
@pytest.mark.parametrize('root', [None])
async def test_notifications(session, session_manager, protocol, root):
    root = session_manager

    await session.socket.receive_json()  # Skip init
    await session.call(
        id=id(root),
        name='create',
        args=[protocol.filename, protocol.text]
    )

    await session.socket.receive_json()  # Skip ack
    res = await session.socket.receive_json()

    await session.call(
        id=res['data']['i'],
        name='run',
        args=[]
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

    await session.call(
        id=id(root),
        name='get_session',
        args=[]
    )

    await session.socket.receive_json()  # Skip ack
    res = await session.socket.receive_json()

    # There are 101 commands in the protocol
    assert len(res['data']['v']['command_log']['v']) == 101
