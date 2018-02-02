import asyncio
import pytest
import time

from opentrons.server import rpc
from threading import Event

from uuid import uuid4 as uuid


class Foo(object):
    STATIC = 'static'

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


class Notifications(object):
    def __init__(self, loop):
        self.loop = loop
        self.queue = asyncio.Queue(loop=loop)

    def put(self, value):
        asyncio.run_coroutine_threadsafe(
            self.queue.put(value), self.loop)

    def __aiter__(self):
        return self

    async def __anext__(self):
        res = await self.queue.get()

        if res is None:
            raise StopAsyncIteration

        return res


class TickTock(object):
    def __init__(self):
        self.value = 0

    # Called by session test fixture to set loop
    def init(self, loop):
        self.notifications = Notifications(loop)
        self.running = Event()

    def start(self):
        self.running.set()
        for i in range(5):
            self.running.wait()
            self.notifications.put(i)
            time.sleep(0.1)
        return "Done!"

    def pause(self):
        self.running.clear()
        return "Paused"

    def resume(self):
        self.running.set()
        return "Resumed"


def type_id(instance):
    return id(type(instance))


@pytest.mark.parametrize('root', [Foo(0)])
async def test_call(session, root):
    res = session.server.call_and_serialize(lambda: root)
    assert res == {'v': {'value': 0}, 't': type_id(root), 'i': id(root)}


@pytest.mark.parametrize('root', [Foo(0)])
async def test_init(session, root):
    serialized_type = session.server.call_and_serialize(lambda: type(root))
    expected = {
        'root': {
            'i': id(root),
            't': type_id(root),
            'v': {'value': 0}
        },
        'type': serialized_type,
        '$': {'type': rpc.CONTROL_MESSAGE}}

    assert serialized_type['v']['STATIC'] == 'static', \
        'Class attributes are serialized correctly'
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


@pytest.mark.parametrize('root', [Foo(0)])
async def test_get_object_by_id(session, root):
    await session.socket.receive_json()  # Skip init

    await session.call(
        name='get_object_by_id',
        args=[type_id(root)])

    await session.socket.receive_json()  # Skip ack
    res = await session.socket.receive_json()  # Get call result
    expected = {'$': {
                    'token': session.token,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': {
                    'i': type_id(session.server.root),
                    't': id(type),
                    'v': {
                        'STATIC',
                        'value',
                        'throw',
                        'next',
                        'combine',
                        'add'
                       }
                    }
                }
    # We care only about dictionary keys, since we don't want
    # to track ids of function objects
    res['data']['v'] = set(res['data']['v'])

    assert res == expected


@pytest.mark.parametrize('root', [Foo(0)])
async def test_call_on_result(session, root):
    await session.socket.receive_json()  # Skip init

    await session.call(
        id=id(root),
        name='value',
        args=[]
    )

    await session.socket.receive_json()  # Skip ack
    res = await session.socket.receive_json()  # Get call result
    expected = {'$': {
                    'token': session.token,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': 0}
    assert res == expected

    await session.call(
        id=id(root),
        name='add',
        args=[1]
    )

    await session.socket.receive_json()  # Skip ack
    res = await session.socket.receive_json()  # Get call result
    expected = {'$': {
                    'token': session.token,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': 1}

    assert res == expected


@pytest.mark.parametrize('root', [Foo(0)])
async def test_exception_on_call(session, root):
    await session.socket.receive_json()  # Skip init

    await session.call(
        id=id(root),
        name='throw',
        args=[]
    )

    await session.socket.receive_json()  # Skip ack
    res = await session.socket.receive_json()  # Get call result
    expected = {'$': {
                    'token': session.token,
                    'status': 'error',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': 'Exception [line unknown]: Kaboom!'}

    assert res == expected


@pytest.mark.parametrize('root', [Foo(0)])
async def test_call_on_reference(session, root):
    # Flip root object outside of constructor to ensure
    # server is re-initialized properly
    session.server.root = TickTock()
    session.server.root = root

    # TODO (artyom, 20170905): assert server.monitor_events task gets canceled

    await session.socket.receive_json()  # Skip init

    await session.call(
        id=id(root),
        name='next',
        args=[]
    )

    await session.socket.receive_json()  # Skip ack
    foo_id = (await session.socket.receive_json())['data']['i']

    await session.call(
        id=id(root),
        name='combine',
        args=[{'i': foo_id}]
    )
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
                    't': type_id(root),
                    'v': {'value': 1}}}
    assert res == expected


@pytest.mark.parametrize('root', [TickTock()])
async def test_notifications(session, root):
    await session.socket.receive_json()  # Skip init

    await session.call(
        id=id(root),
        name='start',
        args=[]
    )
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


@pytest.mark.parametrize('root', [TickTock()])
async def test_concurrent_calls(session, root):
    await session.socket.receive_json()  # Skip init

    await session.call(
        id=id(root),
        name='start',
        args=[]
    )
    await session.socket.receive_json()  # Skip ack

    await session.call(
        id=id(root),
        name='pause',
        args=[]
    )

    res = []
    while True:
        message = await session.socket.receive_json()
        if 'token' in message['$']:
            message['$'].pop('token')

        res += [message]
        if message.get('data') == 'Paused':
            break
    # Confirm receiving first notification, ACK for pause and pause result
    assert res == [
        {'data': 0, '$': {'type': 2}},
        {'$': {'type': 1}},
        {'data': 'Paused', '$': {'status': 'success', 'type': 0}}
    ]
    res.clear()
    await asyncio.sleep(1.0)

    await session.call(
        id=id(root),
        name='resume',
        args=[]
    )

    while True:
        message = await session.socket.receive_json()
        if 'token' in message['$']:
            message['$'].pop('token')

        res += [message]
        if message.get('data') == 'Done!':
            break

    assert res == [
        {'$': {'type': 1}},  # resume() call ACK
        {'$': {'status': 'success', 'type': 0}, 'data': 'Resumed'},  # resume() call result # noqa
        # Original start() call proceeds
        {'$': {'type': 2}, 'data': 1},
        {'$': {'type': 2}, 'data': 2},
        {'$': {'type': 2}, 'data': 3},
        {'$': {'type': 2}, 'data': 4},
        {'$': {'status': 'success', 'type': 0}, 'data': 'Done!'}
    ]


async def call(socket, **kwargs):
    token = str(uuid())
    request = {'$': {'token': token}, **kwargs}
    await socket.send_json(request)
    return token


# TODO (artyom, 20170920): make it a shared func
async def read_until(socket, messages):
    """
    Reads from socket until all messages from the list are received
    Returns the list of messages read
    """
    messages = messages.copy()
    res = []
    while messages:
        data = await socket.receive_json()
        res += [data]
        if data in messages:
            messages.remove(data)
    return res


def token(message):
    return message['$']['token']


def result_message(token, data):
    return {
        '$': {'token': token, 'type': 0, 'status': 'success'},
        'data': data}


def ack_message(token):
    return {'$': {'token': token, 'type': 1}}


def notification_message(data):
    return {'$': {'type': 2}, 'data': data}


# Await in list comprehensions is python 3.6
# https://www.python.org/dev/peps/pep-0530/
async def async_iterate(iterable):
    futures, _ = await asyncio.wait(iterable)
    res = [future.result() for future in futures]
    return res


def message_key(message):
    meta = message['$']
    data = message.get('data', '')
    return str(meta.get('type')) + meta.get('token', '') + str(data)


@pytest.mark.parametrize('root', [TickTock()])
async def test_concurrent_and_disconnect(loop, root, session, connect):  # noqa C901
    n_sockets = 20
    sockets = await async_iterate([connect() for _ in range(n_sockets)])

    # TODO (artyom, 20170920): look for pattern to call several coroutines
    # and collect results in one line
    tokens = await async_iterate([
        call(socket, id=id(root), name='start', args=[])
        for socket in sockets])

    await sockets.pop(1).close()

    stop_messages = [result_message(token, 'Done!') for token in tokens]
    results = await async_iterate(
        [read_until(socket, stop_messages) for socket in sockets])

    for res in results:
        # First message is root info
        assert res.pop(0)['$'] == {'type': 3}
        expected = []
        # All acks received
        expected.extend([ack_message(token) for token in tokens])
        # All results received
        expected.extend([result_message(token, 'Done!') for token in tokens])
        # All notifications received. 5 ticks per notifications
        expected.extend([notification_message(i) for i in range(5)] * n_sockets)  # noqa
        assert sorted(res, key=message_key) == sorted(expected, key=message_key)  # noqa
