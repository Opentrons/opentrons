import asyncio
import os
import pytest

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

    responses = []

    # NOTE: Streaming absolutely every response in the loop
    # causes aiohttp flow control to fail and start
    # composing partial frames. For now, we'll just sample
    # 50 responses we've got, and confirm that all are notifications
    # which means that async calls are working and the actual
    # call hasn't returned yet, but notifications are coming in
    for i in range(100):
        responses.append(await session.socket.receive_json())

    assert all([
        res['$']['type'] == rpc.NOTIFICATION_MESSAGE for res in responses])
