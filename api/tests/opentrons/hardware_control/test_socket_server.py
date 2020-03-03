import asyncio
import json
import os
import sys
import tempfile
from types import MethodType
from typing import Dict, List, Optional

import pytest

from opentrons.config import robot_configs
from opentrons.types import Mount, Point
from opentrons.hardware_control.pipette import Pipette
from opentrons.hardware_control.types import Axis, CriticalPoint
import opentrons.hardware_control as hc
import opentrons.hardware_control.socket_server as sockserv


pytestmark = pytest.mark.skipif(sys.platform.startswith('win'),
                                reason='No unix domain sockets on windows')


@pytest.fixture
async def hc_stream_server(loop):
    # Using tempfile the library module rather than the tmpfile fixture here
    # because the path length limit for sockets is 100-ish characters
    with tempfile.TemporaryDirectory() as td:
        sock = os.path.join(td, 'tst')
        api = await hc.API.build_hardware_simulator(loop=loop)
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

    monkeypatch.setattr(server, '_dispatch', fake_dispatch)

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

    monkeypatch.setattr(server, '_dispatch', forever_dispatch)
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

    monkeypatch.setattr(server, '_dispatch', error_dispatch)
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


async def test_errors_from_invoke(hc_stream_server, loop):
    """ Test that various jsonrpc errors actually get back to us """

    sock, server = hc_stream_server
    reader, writer = await asyncio.open_unix_connection(
        sock)
    decoder = sockserv.JsonStreamDecoder(reader)
    writer.write(b'aojsbdakbsdkabsdkh')
    writer.write(json.dumps({'this is invalid': 'jsonrpc'}).encode())
    resp = await decoder.read_object()
    assert resp['jsonrpc'] == '2.0'
    assert resp['error']['code'] == -32600
    writer.write(
        json.dumps({'jsonrpc': '2.0', 'method': 'aouhsoashdas',
                    'params': [], 'id': 1}).encode())
    resp = await decoder.read_object()
    assert resp['error']['code'] == -32601


async def test_basic_method(hc_stream_server, loop, monkeypatch):
    """ Test methods with no non-serializable argument types """
    sock, server = hc_stream_server
    reader, writer = await asyncio.open_unix_connection(
        sock)
    # Check a method that requires no arg xforms and make sure it works
    passed_duration = None

    def fake_delay(obj, duration_s):
        nonlocal passed_duration
        passed_duration = duration_s

    bound = MethodType(fake_delay, server._api)
    monkeypatch.setattr(
        server._api, 'delay', bound)
    server._methods = sockserv.build_jrpc_methods(server._api)
    request = json.dumps({'jsonrpc': '2.0', 'method': 'delay',
                          'params': {'duration_s': 15.2},
                          'id': 1})
    writer.write(request.encode())
    decoder = sockserv.JsonStreamDecoder(reader)
    resp = await decoder.read_object()
    assert resp == {'jsonrpc': '2.0', 'result': None, 'id': 1}
    assert passed_duration == 15.2

    passed_fw = None
    passed_modeset = None

    async def fake_update_firmware(obj,
                                   firmware_file,
                                   loop=None,
                                   explicit_modeset=True):
        nonlocal passed_fw
        nonlocal passed_modeset
        assert not loop
        passed_fw = firmware_file
        passed_modeset = explicit_modeset
        await asyncio.sleep(0.1)
        return 'i programmed the cool file'

    bound = MethodType(fake_update_firmware, server._api)
    monkeypatch.setattr(server._api, 'update_firmware', bound)
    server._methods = sockserv.build_jrpc_methods(server._api)
    request = json.dumps({'jsonrpc': '2.0', 'method': 'update_firmware',
                          'params': {'firmware_file': "cool file.hex",
                                     'explicit_modeset': False},
                          'id': 2})
    writer.write(request.encode())
    resp = await decoder.read_object()
    assert resp == {'jsonrpc': '2.0',
                    'result': 'i programmed the cool file',
                    'id': 2}
    assert passed_fw == 'cool file.hex'
    assert passed_modeset is False


async def test_complex_method(hc_stream_server, loop, monkeypatch):
    """ Test methods with arguments and returns that need serialization """
    sock, server = hc_stream_server
    reader, writer = await asyncio.open_unix_connection(
        sock)
    decoder = sockserv.JsonStreamDecoder(reader)
    request = json.dumps({
        'jsonrpc': '2.0', 'method': 'cache_instruments',
        'params': {
            'require': {
                'left': 'p300_single_v1.5',
                'right': 'p1000_single_v1'
            }
        },
        'id': 1
    })
    writer.write(request.encode())
    resp = await decoder.read_object()
    assert resp['id'] == 1
    assert 'error' not in resp, resp
    assert resp['result'] is None
    gai = json.dumps({
        'jsonrpc': '2.0', 'method': 'get_attached_instruments',
        'params': {}, 'id': 2
    })
    writer.write(gai.encode())
    gai_resp = await decoder.read_object()
    assert gai_resp['id'] == 2
    assert 'result' in gai_resp
    attached = await server._api.attached_instruments
    assert gai_resp['result']['LEFT']\
        == attached[Mount.LEFT]


@pytest.mark.parametrize(
    'paramtype,native,serializable', [
        (Mount, Mount.LEFT, 'LEFT'),
        (Axis, Axis.A, 'A'),
        (CriticalPoint, CriticalPoint.NOZZLE, 'NOZZLE'),
        (Point, Point(1, 2, 3), [1, 2, 3]),
        (Dict[Mount, str], {Mount.LEFT: 'way hay'}, {'LEFT': 'way hay'}),
        (Dict[Axis, bool], {Axis.X: True}, {'X': True}),
        (robot_configs.robot_config,
         robot_configs.load(),
         list(robot_configs.config_to_save(robot_configs.load()))),
        (Dict[Mount, Pipette.DictType],
         {Mount.LEFT: {'asdasd': 2, 'asda': False}},
         {'LEFT': {'asdasd': 2, 'asda': False}}),
        (List[Axis], [Axis.X, Axis.A], ['X', 'A']),
        (Optional[CriticalPoint], None, None),
        (Optional[CriticalPoint], CriticalPoint.NOZZLE, 'NOZZLE'),
    ]
)
def test_serializers(paramtype, native, serializable):
    assert paramtype in sockserv._SERDES
    serdes = sockserv._SERDES[paramtype]
    assert serdes.serializer(native) == serializable
    assert serdes.deserializer(serializable) == native
