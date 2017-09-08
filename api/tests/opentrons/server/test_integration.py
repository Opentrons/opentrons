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

    assert res['data'][1]['v']['state'] == 'loaded'

    res = await session.socket.receive_json()
    await session.call(
        id=res['data']['i'],
        name='run',
        args=['Virtual Smoothie']
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

    assert len(res['data']['v']['command_log']['v']) == 105
    responses = [
        res for res in responses
        if res['data'][0] == 'session.state.change']
    assert len(responses) == 107

    states = [response['data'][1]['v']['state'] for response in responses]

    assert states[0] == 'running', \
        'First state is "running"'
    assert states[-1] == 'finished', \
        'Last state is "finished"'
