import asyncio
import typing

import pytest
import sys
import time
from threading import Event
from uuid import uuid4 as uuid

from starlette.testclient import WebSocketTestSession

from opentrons.protocol_api.execute import ExceptionInProtocolError

from robot_server.service.dependencies import get_rpc_server
from robot_server.service.rpc import rpc


class Session(typing.NamedTuple):
    server: rpc.RPCServer
    socket: WebSocketTestSession
    token: str
    call: typing.Callable


@pytest.fixture
def session(loop, api_client, request) -> Session:
    """
    Create testing session. Tests using this fixture are expected
    to have @pytest.mark.parametrize('root', [value]) decorator set.
    If not set root will be defaulted to None
    """
    # Root object
    root = request.getfixturevalue('root')
    # Test state
    state = {}

    async def get_server():
        # We want the server created here.
        _internal_server = rpc.RPCServer(None, root)
        state['server'] = _internal_server
        return _internal_server

    # Override the RPC server dependency
    api_client.app.dependency_overrides[get_rpc_server] = get_server

    # Connect
    socket = api_client.websocket_connect("/")
    token = str(uuid())

    def call(**kwargs):
        _send_data = {
            '$': {
                'token': token
            },
        }
        _send_data.update(kwargs)
        return socket.send_json(_send_data)

    server = state['server']

    yield Session(server, socket, token, call)

    server.shutdown()
    socket.close()


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

    def throw_eipe(self):
        try:
            raise Exception('Kaboom!')
        except Exception:
            t, v, b = sys.exc_info()
        raise ExceptionInProtocolError(v, b,
                                       'This is a test',
                                       10)


class Notifications(object):
    def __init__(self):
        self._loop = None
        self._queue = None

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

    @property
    def queue(self) -> asyncio.Queue:
        if not self._queue:
            self._queue = asyncio.Queue(loop=self.loop)
        return self._queue

    @property
    def loop(self):
        if not self._loop:
            self._loop = asyncio.get_event_loop()
        return self._loop


class TickTock(object):
    def __init__(self):
        self.value = 0
        self.notifications = Notifications()
        self.running = Event()

    def start(self):
        self.running.set()
        for i in range(5):
            self.running.wait()
            self.notifications.put(i)
            time.sleep(.1)
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
def test_call(session, root):
    res = session.server.call_and_serialize(lambda: root)
    assert res == {'v': {'value': 0}, 't': type_id(root), 'i': id(root)}


@pytest.mark.parametrize('root', [Foo(0)])
def test_init(session, root):
    serialized_type = session.server.call_and_serialize(lambda: type(root))
    expected = {
        'root': {
            'i': id(root),
            't': type_id(root),
            'v': {'value': 0}
        },
        'type': serialized_type,
        '$': {'type': rpc.CONTROL_MESSAGE, 'monitor': True}
    }

    assert serialized_type['v']['STATIC'] == 'static', \
        'Class attributes are serialized correctly'
    res = session.socket.receive_json()
    assert res == expected


@pytest.mark.parametrize('root', [Foo(0)])
def test_exception_during_call(session, root):
    session.socket.receive_json()
    session.call()
    res = session.socket.receive_json()
    assert res.pop('$') == {
        'type': rpc.CALL_ACK_MESSAGE,
        'token': session.token
    }
    res = session.socket.receive_json()
    assert res.pop('$') == {
        'type': rpc.CALL_NACK_MESSAGE,
        'token': session.token
    }
    assert res.pop('reason').startswith('TypeError:')
    assert res == {}


@pytest.mark.parametrize('root', [Foo(0)])
def test_get_object_by_id(session, root):
    session.socket.receive_json()  # Skip init

    session.call(
        name='get_object_by_id',
        args=[type_id(root)])

    session.socket.receive_json()  # Skip ack
    res = session.socket.receive_json()  # Get call result
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
                        'throw_eipe',
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
def test_call_on_result(session, root):
    session.socket.receive_json()  # Skip init

    session.call(
        id=id(root),
        name='value',
        args=[]
    )

    session.socket.receive_json()  # Skip ack
    res = session.socket.receive_json()  # Get call result
    expected = {'$': {
                    'token': session.token,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': 0}
    assert res == expected

    session.call(
        id=id(root),
        name='add',
        args=[1]
    )

    session.socket.receive_json()  # Skip ack
    res = session.socket.receive_json()  # Get call result
    expected = {'$': {
                    'token': session.token,
                    'status': 'success',
                    'type': rpc.CALL_RESULT_MESSAGE},
                'data': 1}

    assert res == expected


@pytest.mark.parametrize('root', [Foo(0)])
def test_exception_on_call(session, root):
    session.socket.receive_json()  # Skip init

    session.call(
        id=id(root),
        name='throw',
        args=[]
    )

    session.socket.receive_json()  # Skip ack
    res = session.socket.receive_json()  # Get call result
    expected_meta = {
        'token': session.token,
        'status': 'error',
        'type': rpc.CALL_RESULT_MESSAGE
    }
    expected_message = 'Exception: Kaboom!'

    assert res['$'] == expected_meta
    assert res['data']['message'] == expected_message
    assert isinstance(res['data']['traceback'], str)

    session.call(
        id=id(root),
        name='throw_eipe',
        args=[]
    )

    session.socket.receive_json()  # Skip ack
    res = session.socket.receive_json()  # Get call result
    expected_meta = {
        'token': session.token,
        'status': 'error',
        'type': rpc.CALL_RESULT_MESSAGE
    }
    expected_message = 'Exception [line 10]: This is a test'

    assert res['$'] == expected_meta
    assert res['data']['message'] == expected_message
    assert isinstance(res['data']['traceback'], str)


@pytest.mark.parametrize('root', [Foo(0)])
def test_call_on_reference(session, root):
    # Flip root object outside of constructor to ensure
    # server is re-initialized properly
    session.server.root = TickTock()
    session.server.root = root

    # TODO (artyom, 20170905): assert server.monitor_events task gets canceled

    session.socket.receive_json()  # Skip init

    session.call(
        id=id(root),
        name='next',
        args=[]
    )

    session.socket.receive_json()  # Skip ack
    foo_id = (session.socket.receive_json())['data']['i']

    session.call(
        id=id(root),
        name='combine',
        args=[{'i': foo_id}]
    )
    session.socket.receive_json()  # Skip ack
    res = session.socket.receive_json()

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
def test_notifications(session, root):
    session.socket.receive_json()  # Skip init

    session.call(
        id=id(root),
        name='start',
        args=[]
    )
    session.socket.receive_json()  # Skip ack

    res = []

    # Wait for notifications
    for i in range(5):
        message = session.socket.receive_json()
        res.append((message['$']['type'], message['data']))

    assert res == [(rpc.NOTIFICATION_MESSAGE, i) for i in range(5)]

    # Last comes call result
    message = session.socket.receive_json()
    assert message == {
        '$': {
            'status': 'success',
            'type': 0, 'token': session.token
        },
        'data': 'Done!'
    }


@pytest.mark.api1_only
@pytest.mark.parametrize('root', [TickTock()])
def test_concurrent_calls(session, root):
    session.socket.receive_json()  # Skip init

    session.call(
        id=id(root),
        name='start',
        args=[]
    )
    session.socket.receive_json()  # Skip ack

    session.call(
        id=id(root),
        name='pause',
        args=[]
    )

    res = []
    while True:
        message = session.socket.receive_json()
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
    time.sleep(1.0)

    session.call(
        id=id(root),
        name='resume',
        args=[]
    )

    while True:
        message = session.socket.receive_json()
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
