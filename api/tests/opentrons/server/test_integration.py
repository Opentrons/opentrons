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
    responses = [
        res for res in responses
        if res['data'][0]['v']['name'] == 'session.state.change']
    assert len(responses) == 2, 'there are two state change events'

    assert responses[0]['data'][0]['v']['arguments']['v']['state'] == \
        responses[0]['data'][1]['v']['state'] == 'running', \
        'First state change event argument is "running" and session instance state is "running"'  # noqa
    assert responses[1]['data'][0]['v']['arguments']['v']['state'] == \
        responses[1]['data'][1]['v']['state'] == 'finished', \
        'Second state change event argument is "finished" and session instance state is "finished"'  # noqa
