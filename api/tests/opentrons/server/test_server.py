import asyncio
import pytest
import time

from opentrons.server import rpc


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

    def start(self):
        for i in range(5):
            self.notifications.put(i)
            time.sleep(0.1)
        return "Done!"


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
                    'v': set([
                        'value',
                        'throw',
                        'next',
                        'combine',
                        'add'
                       ])
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
                'data': 'Exception: Kaboom!'}

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
