import asyncio
import typing

import pytest
import sys
from threading import Event, Semaphore
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


class NotifyTester(object):
    """
    An RPC test object that, when start is called, will send 5 notifications
    then wait on an event which is initially cleared. Calling finish will
    set the event and cause start to return.
    """
    def __init__(self):
        self.value = 0
        self.notifications = Notifications()
        self.running = Event()
        self.running.clear()

    def start(self):
        for i in range(5):
            self.notifications.put(i)
        self.running.wait()
        return "Done!"

    def finish(self):
        self.running.set()
        return "Finishing"


class ConcurrentCallTester(object):
    """
    An RPC test object with a start methond that will send a notifcation, wait
    on a semaphore, send another notification, wait on a semaphore, then
    return. The semaphore's initial count is 0.
    resume will will release the semaphore.
    Using the notifications and semaphore, the unit test can prove that
    concurrent function calls work.
    """
    def __init__(self):
        self.notifications = Notifications()
        # Semaphore used for control of execution.
        self.running = Semaphore(0)

    def start(self):
        # Notify that we're starting
        self.notifications.put("starting")
        # Wait on the semaphore.
        self.running.acquire()
        # Notify that we are awake
        self.notifications.put("awake")
        # Wait on the semaphore
        self.running.acquire()
        return "Done!"

    def resume(self):
        self.running.release()
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
def test_call_unknown_object(session, root):
    session.socket.receive_json()  # Skip init

    session.call(
        id=1234321,
        name='value',
        args=[]
    )
    session.socket.receive_json()  # Skip ack

    x = session.socket.receive_json()  # Skip ack
    assert x == {
        "$": {
            "token": session.token,
            "type": rpc.CALL_NACK_MESSAGE
        },
        "reason": "ValueError: object with id 1234321 not found"
    }


@pytest.mark.parametrize('root', [Foo(0)])
def test_call_unknown_method(session, root):
    session.socket.receive_json()  # Skip init

    session.call(
        id=id(root),
        name='no_no_no',
        args=[]
    )
    session.socket.receive_json()  # Skip ack

    x = session.socket.receive_json()  # Skip ack
    assert x == {
        "$": {
            "token": session.token,
            "type": rpc.CALL_NACK_MESSAGE
        },
        "reason":
            "AttributeError: type object 'Foo' has no attribute 'no_no_no'"
    }


@pytest.mark.parametrize('root', [Foo(0)])
def test_ping(session, root):
    session.socket.receive_json()  # Skip init

    session.socket.send_json({"$": {"ping": 1}})

    res = session.socket.receive_json()
    assert {"$": {"type": rpc.PONG_MESSAGE}} == res


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
    session.server.root = NotifyTester()
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


@pytest.mark.parametrize('root', [NotifyTester()])
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

    # Tell notifier to finish
    session.call(
        id=id(root),
        name='finish',
        args=[]
    )

    session.socket.receive_json()  # Skip ack

    # The order of results of finish and start are not deterministic due to
    # being in separate threads. Let's just make sure we got them.
    messages = []
    for i in range(2):
        messages.append(session.socket.receive_json())

    # Sort by the data field (ie the string returned by each function)
    messages.sort(key=lambda o: o['data'])

    assert messages == [
        # Result of start call
        {
            '$': {
                'status': 'success',
                'type': 0, 'token': session.token
            },
            'data': 'Done!'
        },
        # Result of finish call
        {
            '$': {
                'status': 'success',
                'type': 0, 'token': session.token
            },
            'data': 'Finishing'
        }
    ]


@pytest.mark.api1_only
@pytest.mark.parametrize('root', [ConcurrentCallTester()])
def test_concurrent_call(session, root):
    session.socket.receive_json()  # Skip init

    session.call(
        id=id(root),
        name='start',
        args=[]
    )
    session.socket.receive_json()  # Skip ack

    # Get the notification that the function is starting
    r = session.socket.receive_json()
    assert r == {'$': {'type': rpc.NOTIFICATION_MESSAGE},
                 'data': 'starting'}

    # Call function to awaken the thread
    session.call(
        id=id(root),
        name='resume',
        args=[]
    )

    # Ack for call
    r = session.socket.receive_json()
    assert r == {'$': {'token': session.token,
                       'type': rpc.CALL_ACK_MESSAGE}}

    # Result of awaken call
    r = session.socket.receive_json()
    assert r == {'$': {'status': 'success', 'token': session.token,
                       'type': rpc.CALL_RESULT_MESSAGE},
                 'data': 'Resumed'}

    # Notification of being awake
    r = session.socket.receive_json()
    assert r == {'$': {'type': rpc.NOTIFICATION_MESSAGE},
                 'data': 'awake'}

    # Awaken again
    session.call(
        id=id(root),
        name='resume',
        args=[]
    )

    # Ack for call
    r = session.socket.receive_json()
    assert r == {'$': {'token': session.token,
                       'type': rpc.CALL_ACK_MESSAGE}}

    # Result of awaken
    r = session.socket.receive_json()
    assert r == {'$': {'status': 'success', 'token': session.token,
                       'type': rpc.CALL_RESULT_MESSAGE},
                 'data': 'Resumed'}

    # Result of start function
    r = session.socket.receive_json()
    assert r == {'$': {'status': 'success', 'token': session.token,
                       'type': rpc.CALL_RESULT_MESSAGE},
                 'data': 'Done!'}
