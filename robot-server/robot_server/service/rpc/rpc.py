import asyncio
import functools
import logging
import traceback
import typing

from starlette.websockets import WebSocket, WebSocketState

from . import serialize
from opentrons.protocol_api.execute import ExceptionInProtocolError
from concurrent.futures import ThreadPoolExecutor


log = logging.getLogger(__name__)

# Number of executor threads
MAX_WORKERS = 2

# Keep these in sync with ES code
CALL_RESULT_MESSAGE = 0
CALL_ACK_MESSAGE = 1
NOTIFICATION_MESSAGE = 2
CONTROL_MESSAGE = 3
CALL_NACK_MESSAGE = 4
PONG_MESSAGE = 5


class ClientWriterTask(typing.NamedTuple):
    socket: WebSocket
    queue: asyncio.Queue
    task: asyncio.Task


class RPCServer(object):
    def __init__(self, loop, root=None):
        self.monitor_events_task = None
        self.loop = loop or asyncio.get_event_loop()
        self.objects = {}
        self.system = SystemCalls(self.objects)

        self.root = root

        # Allow for two concurrent calls max
        self.executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)

        self.clients: typing.List[ClientWriterTask] = []
        self.tasks = []

    @property
    def root(self):
        return self._root

    @root.setter
    def root(self, value):
        if self.monitor_events_task:
            self.monitor_events_task.cancel()
        self.monitor_events_task = \
            self.loop.create_task(self.monitor_events(value))
        self._root = value

    def shutdown(self):
        for writer in self.clients:
            writer.task.cancel()
        self.monitor_events_task.cancel()

    async def on_shutdown(self):
        """
        Graceful shutdown handler

        See https://docs.aiohttp.org/en/stable/web.html#graceful-shutdown
        """
        for client_write_tasks in self.clients.copy():
            await client_write_tasks.socket.close(code=1001)  # GOING_AWAY

        self.shutdown()

    def send_worker(self, socket: WebSocket) -> ClientWriterTask:
        """
        Create a send queue and task to read from said queue and send objects
        over socket.

        :param socket: Web socket
        :return: The client object.
        """
        _id = id(socket)

        def task_done(future):
            try:
                future.result()
            except Exception:
                log.exception("send_task for socket {} threw:".format(_id))

        async def send_task(socket_: WebSocket, queue_: asyncio.Queue):
            while True:
                payload = await queue_.get()
                if socket_.client_state == WebSocketState.DISCONNECTED:
                    log.debug('Websocket %s closed', id(_id))
                    break

                await socket_.send_json(payload)

        queue: asyncio.Queue = asyncio.Queue(loop=self.loop)
        task = self.loop.create_task(send_task(socket, queue))
        task.add_done_callback(task_done)
        log.debug('Send task for {0} started'.format(_id))

        return ClientWriterTask(socket=socket, queue=queue, task=task)

    async def monitor_events(self, instance):
        async for event in instance.notifications:
            try:
                # Apply notification_max_depth to control object tree depth
                # during serialization to avoid flooding comms
                data = self.call_and_serialize(
                    lambda: event)
                self.send(
                    {
                        '$': {'type': NOTIFICATION_MESSAGE},
                        'data': data
                    })
            except Exception:
                log.exception('While processing event {0}:'.format(event))

    async def handle_new_connection(self, socket: WebSocket):
        """Handle a new client connection"""

        def task_done(future):
            self.tasks.remove(future)
            exception = future.exception()
            if exception:
                log.warning(
                    'While processing message: {0}\nDetails: {1}'.format(
                        exception,
                        traceback.format_exc())
                )

        socket_id = id(socket)

        log.info('Opening Websocket {0}'.format(id(socket)))

        try:
            await socket.send_json({
                '$': {'type': CONTROL_MESSAGE, 'monitor': True},
                'root': self.call_and_serialize(lambda: self.root),
                'type': self.call_and_serialize(lambda: type(self.root))
            })
        except Exception:
            log.exception('While sending root info to {0}'.format(socket_id))

        try:
            # Add new client to list of clients
            self.clients.append(self.send_worker(socket))
            # Async receive client data until websocket is closed
            while socket.client_state != WebSocketState.DISCONNECTED:
                msg = await socket.receive_json()
                task = self.loop.create_task(self.process(msg))
                task.add_done_callback(task_done)
                self.tasks += [task]
        except Exception:
            log.exception('While reading from socket:')
        finally:
            log.info('Closing WebSocket {0}'.format(id(socket)))
            await socket.close()
            # Remove the client from the list
            self.clients = [c for c in self.clients if c.socket != socket]

        return socket

    def build_call(self, _id, name, args):
        if _id not in self.objects:
            raise ValueError(
                'object with id {0} not found'.format(_id))

        obj = self.objects[_id]
        function = getattr(type(obj), name)
        args = self.resolve_args(args)
        kwargs = {}
        # NOTE: since ECMAScript doesn't have a notion of named arguments
        # we are using a convention that the last dictionary parameter will
        # be expanded into kwargs. This introduces a risk of mistreating a
        # legitimate dictionary as kwargs, but we consider it very low.
        if (len(args) > 0) and (isinstance(args[-1], dict)):
            kwargs = args.pop()

        if not function:
            raise ValueError(
                'Function {0} not found in {1}'.format(name, type(obj)))

        if not callable(function):
            raise ValueError(
                'Attribute {0} of {1} is not a function'
                .format(name, type(obj)))

        return functools.partial(function, obj, *args, **kwargs)

    def resolve_args(self, args):
        """
        Resolve function call arguments that have object ids
        into instances of these objects
        """
        def resolve(a):
            if isinstance(a, dict):
                _id = a.get('i', None)
                # If it's a compound type (including dict)
                # Check if it has id (i) to determine that it has
                # a reference in object storage. If it's None, then it's
                # a dict originated at the remote
                return self.objects[_id] if _id else a['v']
            # if array, resolve it's elements
            if isinstance(a, (list, tuple)):
                return [resolve(i) for i in a]
            return a

        return [resolve(a) for a in args]

    async def process(self, data):
        """
        Process the payload from a call

        :param data: dict
        :return: None
        """
        try:
            meta = data.get('$', {})
            token = meta.get('token')
            _id = data.get('id')

            if meta.get('ping'):
                return self.send_pong()

            # if id is missing from payload or explicitely set to null,
            # use the system object
            if _id is None:
                _id = id(self.system)

            try:
                self.send_ack(token)
                func = self.build_call(
                    _id=_id,
                    name=data.get('name'),
                    args=data.get('args', []))
            except Exception as e:
                log.exception("Exception during rpc.Server.process:")
                error = '{0}: {1}'.format(e.__class__.__name__, e)
                self.send_error(error, token)
            else:
                response = await self.make_call(func, token)
                self.send(response)
        except Exception:
            log.exception('Error while processing request')

    def call_and_serialize(self, func, max_depth=0):
        # XXXX: This should really only be called in a new thread (as in
        #       the normal case where it is called in a threadpool)
        call_result = func()
        serialized, refs = serialize.get_object_tree(
            call_result, max_depth=max_depth)
        self.objects.update(refs)
        return serialized

    async def make_call(self, func, token):
        response = {'$': {'type': CALL_RESULT_MESSAGE, 'token': token}}
        try:
            call_result = await self.loop.run_in_executor(
                self.executor, self.call_and_serialize, func)
            response['$']['status'] = 'success'
        except ExceptionInProtocolError as eipe:
            log.exception("Smart exception in protocol")
            response['$']['status'] = 'error'
            call_result = {
                'message': str(eipe),
                'traceback': ''.join(traceback.format_exception(
                    type(eipe.original_exc),
                    eipe.original_exc,
                    eipe.original_tb))
            }
        except Exception as e:
            log.exception("Exception during RPC call:")
            trace = traceback.format_exc()
            try:
                line_msg = ' [line ' + [
                    l.split(',')[0].strip()
                    for l in trace.split('line')
                    if '<module>' in l][0] + ']'
            except Exception:
                line_msg = ''
            finally:
                response['$']['status'] = 'error'
                call_result = {
                    'message': '{0}{1}: {2}'.format(
                        e.__class__.__name__, line_msg, str(e)),
                    'traceback': trace
                }
        finally:
            response['data'] = call_result
        return response

    def send_error(self, text, token):
        self.send({
            '$': {
                'token': token,
                'type': CALL_NACK_MESSAGE
            },
            'reason': text
        })

    def send_ack(self, token):
        self.send({
            '$': {
                'token': token,
                'type': CALL_ACK_MESSAGE
            }
        })

    def send_pong(self):
        self.send({
            '$': {
                'type': PONG_MESSAGE
            }
        })

    def send(self, payload):
        for writer in self.clients:
            asyncio.run_coroutine_threadsafe(
                writer.queue.put(payload),
                self.loop
            )


class SystemCalls(object):
    def __init__(self, objects):
        self.objects = objects
        objects[id(self)] = self

    def get_object_by_id(self, id):
        return self.objects[id]
