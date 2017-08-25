import asyncio
import pytest
import time

from opentrons.server import rpc


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
        self.loop = None

    def set_loop(self, loop):
        self.loop = loop

    def __aiter__(self):
        if self.loop is None:
            raise ValueError('Expected loop to be set')
        self.queue = asyncio.Queue(loop=self.loop)
        return self

    def start(self):
        for i in range(5):
            asyncio.run_coroutine_threadsafe(
                self.queue.put(i), self.loop)
            time.sleep(0.1)

        return "Done!"

    async def __anext__(self):
        res = await self.queue.get()

        if res is None:
            raise StopAsyncIteration

        return res


def type_id(instance):
    return id(type(instance))


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

    res = await session.socket.receive_json()
    assert res == expected


async def test_exception_during_call(session):
    await session.socket.receive_json()
    await session.call()
    res = await session.socket.receive_json()
    assert res.pop('$') == {
        'type': rpc.CALL_NACK_MESSAGE,
        'token': session.token
    }
    assert res.pop('reason').startswith('TypeError: build_call()')
    assert res == {}


async def test_get_root(session):
    session.server.root = Foo(0)

    await session.socket.receive_json()  # Skip init
    await session.call(session.server.control, 'get_root', [])
    await session.socket.receive_json()  # Skip ack
    res = await session.socket.receive_json()  # Get call result

    expected = {'$': {
                    'token': session.token,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': {
                    'i': id(session.server.root),
                    't': type_id(session.server.root),
                    'v': {'value': 0}}}
    assert res == expected


async def test_get_object_by_id(session):
    session.server.root = Foo(0)
    await session.socket.receive_json()  # Skip init

    # Since we are going to retrieve root's type
    # we need to call it first, so it's instance and type ids
    # get cached on a server side
    await session.call(session.server.control, 'get_root', [])
    await session.socket.receive_json()  # Skip ack
    await session.socket.receive_json()  # Get call result

    await session.call(
        session.server.control,
        'get_object_by_id',
        [type_id(session.server.root)])

    await session.socket.receive_json()  # Skip ack
    res = await session.socket.receive_json()  # Get call result
    expected = {'$': {
                    'token': session.token,
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


async def test_call_on_result(session):
    session.server.root = Foo(0)
    await session.socket.receive_json()  # Skip init

    await session.call(session.server.control, 'get_root', [])
    await session.socket.receive_json()  # Skip ack
    await session.socket.receive_json()  # Get call result

    await session.call(session.server.root, 'value', [])
    await session.socket.receive_json()  # Skip ack
    res = await session.socket.receive_json()  # Get call result
    expected = {'$': {
                    'token': session.token,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': 0}
    assert res == expected

    await session.call(session.server.root, 'add', [1])
    await session.socket.receive_json()  # Skip ack
    res = await session.socket.receive_json()  # Get call result
    expected = {'$': {
                    'token': session.token,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': 1}

    assert res == expected


async def test_exception_on_call(session):
    session.server.root = Foo(0)
    await session.socket.receive_json()  # Skip init

    await session.call(session.server.control, 'get_root', [])
    await session.socket.receive_json()  # Skip ack
    await session.socket.receive_json()  # Get call result

    await session.call(session.server.root, 'throw', [])
    await session.socket.receive_json()  # Skip ack
    res = await session.socket.receive_json()  # Get call result
    expected = {'$': {
                    'token': session.token,
                    'status': 'error',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': 'Exception: Kaboom!'}

    assert res == expected


async def test_call_on_reference(session):
    session.server.root = Foo(0)
    await session.socket.receive_json()  # Skip init

    await session.call(session.server.control, 'get_root', [])
    await session.socket.receive_json()  # Skip ack
    await session.socket.receive_json()  # Get call result

    await session.call(session.server.root, 'next', [])
    await session.socket.receive_json()  # Skip ack
    foo_id = (await session.socket.receive_json())['data']['i']

    await session.call(session.server.root, 'combine', [{'i': foo_id}])
    await session.socket.receive_json()  # Skip ack
    res = await session.socket.receive_json()

    new_foo_id = res['data'].pop('i')
    assert foo_id != new_foo_id

    expected = {'$': {
                    'token': session.token,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': {
                    # i was popped out above
                    't': type_id(session.server.root),
                    'v': {'value': 1}}}
    assert res == expected


async def test_notifications(session):
    session.server.root = TickTock()
    await session.socket.receive_json()  # Skip init

    await session.call(session.server.control, 'get_root', [])
    await session.socket.receive_json()  # Skip ack
    await session.socket.receive_json()  # Get call result

    await session.call(session.server.root, 'start', [])
    await session.socket.receive_json()  # Skip ack

    res = []

    # Wait for notifications
    for i in range(5):
        message = await session.socket.receive_json()
        res.append((message['$']['type'], message['data']))

    assert res == [(rpc.NOTIFICATION_MESSAGE, i) for i in range(5)]

    # Last comes call result
    message = await session.socket.receive_json()
    assert message == {
        '$': {
            'status': 'success',
            'type': 0, 'token': session.token
        },
        'data': 'Done!'}
