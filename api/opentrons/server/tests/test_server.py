import asyncio
import json
import logging
import pytest

from aiohttp import WSMsgType
from asyncio import Queue
from aiohttp import web
from uuid import uuid4 as uuid

from opentrons.server import server

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
        value['id'] = self.id
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
    socket = WebSocket()
    s = server.Server(Foo(0))
    monkeypatch.setattr(web, 'WebSocketResponse', lambda: socket)

    future = asyncio.ensure_future(s.handler(None))
    wrapper = ServerWrapper(socket, s)

    async def finalize():
        await wrapper.close()
        await future

    request.addfinalizer(
        lambda : event_loop.run_until_complete(finalize()))

    return wrapper


@pytest.mark.asyncio
async def test_init(session):
    expected = {
        "$meta": 
            {"type": server.CONTROL_MESSAGE, "that": id(session.server)}, 
            "Server": {}}

    init = json.loads(await session.read())
    assert init == expected


@pytest.mark.asyncio
async def test_invalid_call(session):
    init = json.loads(await session.read()) # Skip init
    await session.put({})
    ack = json.loads(await session.read())  # Receive ACK
    expected = {"$meta": {"type": server.CALL_ACK_MESSAGE, "id": session.id}}
    assert ack == expected

    res = json.loads(await session.read())  # Receive call result
    expected = {'$meta': {
                    'id': session.id,
                    'status': 'error',
                    'type': server.CALL_RESULT_MESSAGE},
                    'str': "dispatch() missing 3 required positional arguments: 'that', 'name', "
                    "and 'args'"}

    assert res == expected


@pytest.mark.asyncio
async def test_get_root(session):
    init = json.loads(await session.read()) # Skip init
    await session.put({'that': id(session.server), 'name': 'get_root', 'args': []})

    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Get call result

    expected = {'$meta': {
                    'id': session.id,
                    'status': 'success',
                    'that': id(session.server.root),
                    'type': server.CALL_RESULT_MESSAGE},
          'Foo': {'value': {'int': 0}}}
    assert res == expected


@pytest.mark.asyncio
async def test_call_on_result(session):
    init = json.loads(await session.read()) # Skip init

    # Call get root first, so root id is saved in references dict
    await session.put({'that': id(session.server), 'name': 'get_root', 'args': []})
    json.loads(await session.read())  # Skip ACK
    assert json.loads(await session.read())['$meta']['status'] == 'success'

    await session.put({'that': id(session.server.root), 'name': 'value', 'args': []})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Get call result
    expected = {'$meta': {
                    'id': session.id,
                    'status': 'success',
                    'type': server.CALL_RESULT_MESSAGE},
                'int': 0}

    assert res == expected

    await session.put({'that': id(session.server.root), 'name': 'add', 'args': [1]})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Get call result
    expected = {'$meta': {
                    'id': session.id,
                    'status': 'success',
                    'type': server.CALL_RESULT_MESSAGE},
                'int': 1}

    assert res == expected


@pytest.mark.asyncio
async def test_exception_on_call(session):
    json.loads(await session.read()) # Skip init
    # Call get root first, so root id is saved in references dict
    await session.put({'that': id(session.server), 'name': 'get_root', 'args': []})
    json.loads(await session.read())  # Skip ACK
    json.loads(await session.read())  # Skip call results

    await session.put({'that': id(session.server.root), 'name': 'throw', 'args': []})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Skip call results
    expected = {'$meta': {
                    'id': session.id,
                    'status': 'error',
                    'type': server.CALL_RESULT_MESSAGE},
                'str': 'Kaboom!'}

    assert res == expected


@pytest.mark.asyncio
async def test_call_on_reference(session):
    json.loads(await session.read()) # Skip init
    # Call get root first, so root id is saved in references dict
    await session.put({'that': id(session.server), 'name': 'get_root', 'args': []})
    json.loads(await session.read())  # Skip ACK
    json.loads(await session.read())  # Skip call results

    await session.put({'that': id(session.server.root), 'name': 'next', 'args': []})
    json.loads(await session.read())  # Skip ACK
    foo_id = json.loads(await session.read())['$meta']['that']

    await session.put({
        'that': id(session.server.root),
        'name': 'combine',
        'args': [{'$meta': {'that': foo_id}}]})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())

    new_foo_id = res['$meta'].pop('that')
    assert foo_id != new_foo_id

    expected = {'$meta': {
                    'id': session.id,
                    'status': 'success',
                    'type': server.CALL_RESULT_MESSAGE},
                'Foo': {'value': {'int': 1}}}

    assert res == expected

