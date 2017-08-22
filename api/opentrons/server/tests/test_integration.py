import asyncio
import os
import pytest

from opentrons.server import rpc

# TODO(artyom, 08/22/2017):
# Duplicate code with test_container.py
# Consider consolidating
protocol_text = None
protocol_file = os.path.join(
        os.path.dirname(__file__), 'data', 'dinosaur.py')

with open(protocol_file) as file:
    protocol_text = ''.join(list(file))


async def test_notifications(loop, session, robot_container):
    session.server.root = robot_container
    await session.socket.receive_json()  # Skip init

    await session.call(session.server.control, 'get_root', [])
    await asyncio.sleep(0.5, loop=loop)
    await session.socket.receive_json()  # Skip ack
    await session.socket.receive_json()  # Get call result

    await session.call(session.server.root, 'load_protocol', [protocol_text])
    await asyncio.sleep(1.0, loop=loop)
    await session.socket.receive_json()  # Skip ack

    responses = []

    # NOTE: Streaming absolutely every response in the loop
    # causes aiohttp flow control to fail and start
    # composing partial frames. For now, we'll just sample
    # that out of 50 responses we've got, all are notifications
    # which means that async calls are working fine and the actual
    # call hasn't returned yet
    for i in range(50):
        res = await session.socket.receive_json()
        responses.append(res)

    assert all([
        res['$']['type'] == rpc.NOTIFICATION_MESSAGE for res in responses])
