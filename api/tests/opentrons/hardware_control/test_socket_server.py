import asyncio
import json
import os
import sys
import tempfile

import pytest

import opentrons.hardware_control as hc
import opentrons.hardware_control.socket_server as sockserv

if sys.platform.startswith('win'):
    pytest.skip('No unix domain sockets on windows')


@pytest.fixture
async def hc_stream_server(loop):
    # Using tempfile the library module rather than the tmpfile fixture here
    # because the path length limit for sockets is 100-ish characters
    with tempfile.TemporaryDirectory() as td:
        sock = os.path.join(td, 'tst')
        api = hc.API.build_hardware_simulator(loop=loop)
        server = await sockserv.run(sock, api)
        yield sock, server
    await server.stop()


async def test_multi_write_json(hc_stream_server, loop, monkeypatch):
    sock, server = hc_stream_server

    invoked_with = []
    should_return = 'check it out'

    called = asyncio.Event()

    async def fake_dispatch(call_str):
        nonlocal invoked_with
        nonlocal called
        invoked_with.append(call_str)
        try:
            return should_return
        finally:
            called.set()

    monkeypatch.setattr(sockserv, 'dispatch', fake_dispatch)

    reader, writer = await asyncio.open_unix_connection(
        sock, limit=15)
    writer.write(b'{"theres                       "')
    await writer.drain()
    writer.write(b': "more"}                       ')
    await writer.drain()
    await called.wait()
    assert invoked_with[0] == '{"theres                       ": "more"}'
    readback = await reader.readexactly(len(should_return.encode()))
    assert readback == should_return.encode()


async def test_task_cancel(hc_stream_server, loop, monkeypatch):
    sock, server = hc_stream_server

    async def forever_dispatch(_ignored):
        while True:
            await asyncio.sleep(10)

    monkeypatch.setattr(sockserv, 'dispatch', forever_dispatch)
    reader, writer = await asyncio.open_unix_connection(
        sock, limit=15)
    writer.write(b'{"hi": "there"}')
    await writer.drain()
    # wait for the server task to get woken
    while not server._protocol_instances:
        await asyncio.sleep(0.001)
    # cancel the dispatch task
    for pi in server._protocol_instances:
        for ift in pi._inflight:
            ift.cancel()
    dec = sockserv.JsonStreamDecoder(reader)
    decd = await dec.read_object()
    assert decd['jsonrpc'] == '2.0'
    assert decd['error']['code'] == -32063
    assert decd['error']['message'] == 'execution cancelled'
    assert 'data' in decd['error']


async def test_dispatch_exception(hc_stream_server, loop, monkeypatch):
    sock, server = hc_stream_server

    async def error_dispatch(_ignored):
        raise Exception()

    monkeypatch.setattr(sockserv, 'dispatch', error_dispatch)
    reader, writer = await asyncio.open_unix_connection(
        sock, limit=15)
    writer.write(b'{"hi": "there"}')
    await writer.drain()
    decoder = sockserv.JsonStreamDecoder(reader)
    obj = await decoder.read_object()
    assert obj['jsonrpc'] == '2.0'
    assert obj['error']['code'] == -32063
    assert obj['error']['message'] == 'uncaught exception in dispatch'
    assert 'data' in obj['error']
