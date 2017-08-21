import asyncio
import json
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
        self.closed = False

    def nothing_to_read(self):
        return self.outbound.empty()

    async def put(self, value):
        await self.inbound.put(value)

    async def close(self):
        self.closed = True
        await self.inbound.put(None)

    async def read(self):
        return await self.outbound.get()

    async def prepare(self, request):
        self.request = request

    def send_str(self, s):
        asyncio.ensure_future(self.outbound.put(s))

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


class TickTock(object):
    def __init__(self):
        self.value = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if (self.value > 5):
            raise StopAsyncIteration

        await asyncio.sleep(0.1)
        self.value += 1
        return 'Tick ' + str(self.value)


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


def type_id(instance):
    return id(type(instance))


def make_session(monkeypatch, request, event_loop, instance):
    event_loop.set_debug(enabled=True)

    socket = WebSocket()
    server = rpc.Server(instance)
    monkeypatch.setattr(web, 'WebSocketResponse', lambda: socket)

    future = asyncio.ensure_future(server.handler(None))
    wrapper = ServerWrapper(socket, server)

    async def finalize():
        await wrapper.close()
        await future

    request.addfinalizer(
        lambda: event_loop.run_until_complete(finalize()))

    return wrapper


# TODO: add assert for nothing_to_read into finalizer
# Right now have to add it at the end of every test
# Tried doing and getting an assertion exception all the time
@pytest.fixture
def session(monkeypatch, request, event_loop):
    return make_session(monkeypatch, request, event_loop, Foo(0))


@pytest.fixture
def notify_session(monkeypatch, request, event_loop):
    return make_session(monkeypatch, request, event_loop, TickTock())


@pytest.mark.asyncio
async def test_init(session):
    expected = {
        'control': {
            'instance': {
                'i': id(session.server.control),
                't': type_id(session.server.control),
                'v': {'server': {}}
            },
            'type': {
                'i': type_id(session.server.control),
                't': type_id(type),
                'v': {
                    '__aiter__': {},
                    '__anext__': {},
                    '__dict__': {},
                    '__doc__': None,
                    '__init__': {},
                    '__module__': 'opentrons.server.rpc',
                    '__weakref__': {},
                    'get_object_by_id': {},
                    'get_root': {}}
            }
        },
        '$': {'type': rpc.CONTROL_MESSAGE}}

    res = json.loads(await session.read())
    assert res == expected


@pytest.mark.asyncio
async def test_invalid_call(session):
    json.loads(await session.read())  # Skip init
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
                'data': "TypeError: dispatch() missing 2 required positional arguments: 'name' "  # noqa: E501
                "and 'args'"}

    assert res == expected


@pytest.mark.asyncio
async def test_get_root(session):
    json.loads(await session.read())  # Skip init
    await session.put(
        {'id': id(session.server.control), 'name': 'get_root', 'args': []})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Get call result

    expected = {'$': {
                    'token': session.id,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': {
                    'i': id(session.server.root),
                    't': type_id(session.server.root),
                    'v': {'value': 0}}}
    assert res == expected


@pytest.mark.asyncio
async def test_get_object_by_id(session):
    json.loads(await session.read())  # Skip init
    await session.put(
        {'id': id(session.server.control), 'name': 'get_root', 'args': []})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Get call result

    await session.put(
        {
            'id': id(session.server.control),
            'name': 'get_object_by_id',
            'args': [type_id(session.server.root)]})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Get call result
    expected = {'$': {
                    'token': session.id,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': {
                    'i': type_id(session.server.root),
                    't': id(type),
                    'v': set([
                        '__dict__',
                        '__module__',
                        'value',
                        '__init__',
                        '__doc__',
                        'throw',
                        'next',
                        'combine',
                        'add',
                        '__weakref__'])
                    }
                }
    # We care only about dictionary keys, since we don't want
    # to track ids of function objects
    res['data']['v'] = set(res['data']['v'])

    assert res == expected


@pytest.mark.asyncio
async def test_call_on_result(session):
    json.loads(await session.read())  # Skip init

    await session.put(
        {'id': id(session.server.control), 'name': 'get_root', 'args': []})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Get call result

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

    await session.put(
        {'id': id(session.server.control), 'name': 'get_root', 'args': []})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Get call result

    await session.put(
        {'id': id(session.server.root), 'name': 'throw', 'args': []})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Skip call results
    expected = {'$': {
                    'token': session.id,
                    'status': 'error',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': 'Exception: Kaboom!'}

    assert res == expected


@pytest.mark.asyncio
async def test_call_on_reference(session):
    json.loads(await session.read())    # Skip init

    await session.put(
        {'id': id(session.server.control), 'name': 'get_root', 'args': []})
    json.loads(await session.read())  # Skip ACK
    res = json.loads(await session.read())  # Get call result

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
                    't': type_id(session.server.root),
                    'v': {'value': 1}}}
    assert res == expected


@pytest.mark.asyncio
async def test_notifications(notify_session):
    await notify_session.read()
    res = []
    for i in range(5):
        message = json.loads(await notify_session.read())
        assert message['$']['type'] == rpc.NOTIFICATION_MESSAGE
        res.append(message['data'])

    assert res == [
        'Tick 1',
        'Tick 2',
        'Tick 3',
        'Tick 4',
        'Tick 5',
    ]
