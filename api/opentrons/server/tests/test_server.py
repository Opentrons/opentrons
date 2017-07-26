import asyncio
import json
import logging
import pytest

from aiohttp import WSMsgType
from aiohttp import web
from asyncio import Queue

from uuid import uuid4 as uuid
from opentrons.server import rpc


class WebSocket(object):
    def __init__(self):
        self.inbound = Queue()
        self.outbound = Queue()

    def nothing_to_read(self):
        return self.outbound.empty()

    async def put(self, value):
        await self.inbound.put(value)

    async def close(self):
        await self.inbound.put(None)

    async def read(self):
        return await self.outbound.get()

    async def prepare(self, request):
        self.request = request

    async def send_str(self, s):
        await self.outbound.put(s)

    def __aiter__(self):
        return self

    async def __anext__(self):
        item = await self.inbound.get()
        if item is None:
            raise StopAsyncIteration
        return item


class Message(object):
    def __init__(self, **kwargs):
        [setattr(self, k, v) for k, v in kwargs.items()]


class Foo(object):
    def __init__(self, value):
        self.value = value

    def next(self):
        return Foo(self.value + 1)

    def value(self):
        return self.value

    def add(self, value):
        return self.value + value

    def combine(self, foo):
        return Foo(self.value + foo.value)

    def throw(self):
        raise Exception('Kaboom!')


class ServerWrapper(object):
    def __init__(self, socket, server):
        self.socket = socket
        self.server = server
        self.id = str(uuid())

    async def put(self, value):
        value['$'] = {'token': self.id}
        value = Message(data=json.dumps(value), type=WSMsgType.TEXT)
        await self.socket.put(value)

    async def read(self):
        return await self.socket.read()

    async def close(self):
        await self.socket.close()


# TODO: add assert for nothing_to_read into finalizer
# Right now have to add it at the end of every test
# Tried doing and getting an assertion exception all the time
@pytest.fixture
def session(monkeypatch, request, event_loop):
    event_loop.set_debug(enabled=True)

    socket = WebSocket()
    server = rpc.Server(Foo(0))
    monkeypatch.setattr(web, 'WebSocketResponse', lambda: socket)

    future = asyncio.ensure_future(server.handler(None))
    wrapper = ServerWrapper(socket, server)

    async def finalize():
        await wrapper.close()
        await future

    request.addfinalizer(
        lambda: event_loop.run_until_complete(finalize()))

    return wrapper


@pytest.mark.asyncio
async def test_init(session):
    expected = {
        'data': {
            'i': id(session.server),
            'v': {
                'objects': {},
                'port': 31950,
                'root': {},
                'host': '127.0.0.1'}
            },
        '$': {'type': rpc.CONTROL_MESSAGE}}

    res = json.loads(await session.read())
    assert res == expected


@pytest.mark.asyncio
async def test_invalid_call(session):
    init = json.loads(await session.read())  # Skip init
    await session.put({})
    ack = json.loads(await session.read())   # Receive ACK
    expected = {'$': {'type': rpc.CALL_ACK_MESSAGE, 'token': session.id}}
    assert ack == expected

    res = json.loads(await session.read())   # Receive call result
    expected = {'$': {
                    'token': session.id,
                    'status': 'error',
                    'type': rpc.CALL_RESULT_MESSAGE
                },
                'data': "dispatch() missing 2 required positional arguments: 'name' "  # NOQA
                "and 'args'"}

    assert res == expected


@pytest.mark.asyncio
async def test_get_root(session):
    init = json.loads(await session.read())  # Skip init
    await session.put(
        {'id': id(session.server), 'name': 'get_root', 'args': []})

    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Get call result

    expected = {'$': {
                    'token': session.id,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': {
                    'i': id(session.server.root),
                    'v': {'value': 0}}}
    assert res == expected


@pytest.mark.asyncio
async def test_call_on_result(session):
    init = json.loads(await session.read())  # Skip init

    # Call get root first, so root id is saved in references dict
    await session.put(
        {'id': id(session.server), 'name': 'get_root', 'args': []})
    json.loads(await session.read())  # Skip ACK
    assert json.loads(await session.read())['$']['status'] == 'success'

    await session.put(
        {'id': id(session.server.root), 'name': 'value', 'args': []})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Get call result
    expected = {'$': {
                    'token': session.id,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': 0}

    assert res == expected

    await session.put(
        {'id': id(session.server.root), 'name': 'add', 'args': [1]})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Get call result
    expected = {'$': {
                    'token': session.id,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': 1}

    assert res == expected


@pytest.mark.asyncio
async def test_exception_on_call(session):
    json.loads(await session.read())  # Skip init
    # Call get root first, so root id is saved in references dict
    await session.put(
        {'id': id(session.server), 'name': 'get_root', 'args': []})
    json.loads(await session.read())  # Skip ACK
    json.loads(await session.read())  # Skip call results

    await session.put(
        {'id': id(session.server.root), 'name': 'throw', 'args': []})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Skip call results
    expected = {'$': {
                    'token': session.id,
                    'status': 'error',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': 'Kaboom!'}

    assert res == expected


@pytest.mark.asyncio
async def test_call_on_reference(session):
    json.loads(await session.read())    # Skip init
    # Call get root first, so root id is saved in references dict
    await session.put(
        {'id': id(session.server), 'name': 'get_root', 'args': []})
    json.loads(await session.read())    # Skip ACK
    json.loads(await session.read())    # Skip call results

    await session.put(
        {'id': id(session.server.root), 'name': 'next', 'args': []})
    json.loads(await session.read())    # Skip ACK
    foo_id = json.loads(await session.read())['data']['i']

    await session.put({
        'id': id(session.server.root),
        'name': 'combine',
        'args': [{'i': foo_id}]})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())

    new_foo_id = res['data'].pop('i')
    assert foo_id != new_foo_id

    expected = {'$': {
                    'token': session.id,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': {
                    # i was popped out above
                    'v': {'value': 1}}}
    assert res == expected
