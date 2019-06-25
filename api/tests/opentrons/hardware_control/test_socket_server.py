import asyncio
import inspect
import json
import os
import sys
import tempfile
from types import MethodType
from typing import Dict, List, Optional

import pytest
import jsonrpcclient

from opentrons.config import robot_configs
from opentrons.types import Mount, Point
from opentrons.hardware_control.pipette import Pipette
from opentrons.hardware_control.types import Axis, CriticalPoint
import opentrons.hardware_control as hc
import opentrons.hardware_control.socket_server as sockserv
import opentrons.hardware_control.socket_client as sockcli


pytestmark = pytest.mark.skipif(sys.platform.startswith('win'),
                                reason='No unix domain sockets on windows')


@pytest.fixture
async def socket_server(loop):
    # Using tempfile the library module rather than the tmpfile fixture here
    # because the path length limit for sockets is 100-ish characters
    with tempfile.TemporaryDirectory() as td:
        sock = os.path.join(td, 'tst')
        api = hc.API.build_hardware_simulator(loop=loop)
        server = await sockserv.run(sock, api)
        yield sock, server
    await server.stop()


@pytest.fixture
async def socket_stream_pair(loop, socket_server):
    # Using tempfile the library module rather than the tmpfile fixture here
    # because the path length limit for sockets is 100-ish characters
    sock, server = socket_server
    client = await sockcli.UnixSocketClient.build(sock)
    yield client, server


@pytest.fixture
async def socket_adapter(loop, socket_server):
    # Like socket_stream_pair but using an adapter
    sock, server = socket_server
    adapter = sockcli.JsonRpcAdapter(sock, loop)
    await adapter.connect()
    yield adapter, server


async def test_multi_write_json(socket_stream_pair, loop, monkeypatch):
    client, server = socket_stream_pair

    request = {'jsonrpc': '2.0', 'method': 'pause_with_message',
               'params': {'message': 'hi there'}, 'id': 1}
    request_str = json.dumps(request).encode()
    request_len = len(request_str)
    parts = [request_str[:int(request_len/3)],
             request_str[int(request_len/3): 2*int(request_len/3)],
             request_str[2*int(request_len/3):]]
    # Write the request in parts to make sure we can stitch them
    for part in parts:
        client._connection.writer.write(part)
        await client._connection.writer.drain()
        await asyncio.sleep(0.1)

    resp = await client._connection.decoder.read_object()
    assert resp['id'] == 1
    assert resp['result'] is None


async def test_task_cancel(socket_server, loop, monkeypatch):
    sock, server = socket_server

    async def fake_dispatch(_ignored):
        while True:
            await asyncio.sleep(10)

    monkeypatch.setattr(server, '_dispatch', fake_dispatch)

    async def cancel():
        # wait for the server task to get woken
        while not server._protocol_instances:
            await asyncio.sleep(0.001)
        # cancel the dispatch task
        for pi in server._protocol_instances:
            while not pi._inflight:
                await asyncio.sleep(0.001)
            for ift in pi._inflight:
                print("about to call cancel")
                ift.cancel()
                print("called cancel")
    client = await sockcli.UnixSocketClient.build(sock)
    pause_obj, _whocares = await asyncio.gather(
        client.request('pause_with_message', message='hi there'),
        cancel(),
        return_exceptions=True)
    assert isinstance(
        pause_obj, jsonrpcclient.exceptions.ReceivedErrorResponseError)
    print(pause_obj.response.data)
    assert pause_obj.response.code == -32063
    assert pause_obj.response.message == 'execution cancelled'


async def test_dispatch_exception(socket_server, loop, monkeypatch):
    sock, server = socket_server

    async def error_dispatch(_ignored):
        raise Exception()

    monkeypatch.setattr(server, '_dispatch', error_dispatch)
    client = await sockcli.UnixSocketClient.build(sock)
    with pytest.raises(
            jsonrpcclient.exceptions.ReceivedErrorResponseError)\
            as excinfo:
        await client.request('pause_with_message', message='hi there')
    assert excinfo.value.response.code == -32063


async def test_errors_from_invoke(socket_stream_pair, loop):
    """ Test that various jsonrpc errors actually get back to us """

    client, server = socket_stream_pair
    client._connection.writer.write(b'aojsbdakbsdkabsdkh')
    client._connection.writer.write(
        json.dumps({'this is invalid': 'jsonrpc'}).encode())
    resp = await client._connection.decoder.read_object()
    assert resp['jsonrpc'] == '2.0'
    assert resp['error']['code'] == -32600
    client._connection.writer.write(
        json.dumps({'jsonrpc': '2.0', 'method': 'aouhsoashdas',
                    'params': [], 'id': 1}).encode())
    resp = await client._connection.decoder.read_object()
    assert resp['error']['code'] == -32601


async def test_basic_method(socket_stream_pair, loop, monkeypatch):
    """ Test methods with no non-serializable argument types """
    client, server = socket_stream_pair

    # Check a non-async method and make sure it works
    passed_message = None

    def fake_pause_with_message(obj, message):
        nonlocal passed_message
        passed_message = message

    bound = MethodType(fake_pause_with_message, server._api)
    monkeypatch.setattr(
        server._api, 'pause_with_message', bound)
    server._methods = sockserv.build_jrpc_methods(server._api)
    resp = await client.request('pause_with_message', message='hello')
    assert isinstance(resp.data, jsonrpcclient.response.SuccessResponse)
    assert resp.data.result is None

    passed_fw = None
    passed_modeset = None
    assert passed_message == 'hello'

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
    resp = await client.request('update_firmware',
                                firmware_file='some cool file',
                                explicit_modeset=False)

    assert isinstance(resp.data, jsonrpcclient.response.SuccessResponse)
    assert resp.data.result == 'i programmed the cool file'

    assert passed_fw == 'some cool file'
    assert passed_modeset is False


async def test_complex_method(socket_stream_pair, loop, monkeypatch):
    """ Test methods with arguments and returns that need serialization """
    client, server = socket_stream_pair
    resp = await client.request('cache_instruments',
                                require={Mount.LEFT: 'p300_single_v1.5',
                                         Mount.RIGHT: 'p1000_single_v1'})
    assert isinstance(resp.data, jsonrpcclient.response.SuccessResponse)
    assert resp.data.result is None
    gai_resp = await client.request('get_attached_instruments')
    assert isinstance(gai_resp.data, jsonrpcclient.response.SuccessResponse)
    attached = await server._api.attached_instruments
    assert gai_resp.data.result[Mount.LEFT]\
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
def test_serializers(paramtype, native, serializable, config_tempdir):
    assert paramtype in sockserv._SERDES
    serdes = sockserv._SERDES[paramtype]
    assert serdes.serializer(native) == serializable
    assert serdes.deserializer(serializable) == native


@pytest.mark.parametrize(
    "which_prop",
    [pname for pname, prop
     in inspect.getmembers(hc.API,
                           lambda p: isinstance(p, property))
     if pname not in ['loop', 'attached_modules', 'is_simulator_sync']])
async def test_client_property(socket_adapter, which_prop, loop):
    sim = hc.API.build_hardware_simulator(loop=loop)
    client, server = socket_adapter
    remote_prop = await getattr(client, which_prop)
    local_prop = await getattr(sim, which_prop)
    assert remote_prop == local_prop
