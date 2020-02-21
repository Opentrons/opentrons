import asyncio
import aiohttp
import functools
import json
import logging
import traceback

from aiohttp import web
from aiohttp import WSCloseCode
from asyncio import Queue
from api.aiohttp import serialize
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


class RPCServer(object):
    def __init__(self, app, root=None):
        self.monitor_events_task = None
        self.app = app
        self.loop = app.loop or asyncio.get_event_loop()
        self.objects = {}
        self.system = SystemCalls(self.objects)

        self.root = root

        # Allow for two concurrent calls max
        self.executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)

        self.clients = {}
        self.tasks = []

        self.app.router.add_get('/', self.handler)
        self.app.on_shutdown.append(self.on_shutdown)

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

    def start(self, host, port):
        # This call will block while aiohttp is running
        # run_app is capable of catching SIGINT and shutting down
        log.info("Starting aiohttp on {}:{}".format(host, port))
        web.run_app(self.app, host=host, port=port)

    def shutdown(self):
        [task.cancel() for task, _ in self.clients.values()]
        self.monitor_events_task.cancel()

    async def on_shutdown(self, app):
        """
        Graceful shutdown handler

        See https://docs.aiohttp.org/en/stable/web.html#graceful-shutdown
        """
        for ws in self.clients.copy():
            await ws.close(code=WSCloseCode.GOING_AWAY,
                           message='Server shutdown')
        self.shutdown()

    def send_worker(self, socket):
        _id = id(socket)

        def task_done(future):
            try:
                future.result()
            except Exception:
                log.exception("send_task for socket {} threw:".format(_id))

        async def send_task(socket, queue):
            while True:
                payload = await queue.get()
                if socket.closed:
                    log.debug('Websocket {0} closed'.format(id(_id)))
                    break

                # see: http://aiohttp.readthedocs.io/en/stable/web_reference.html#aiohttp.web.StreamResponse.drain # NOQA
                await socket.drain()
                await socket.send_json(payload)

        queue = Queue(loop=self.loop)
        task = self.loop.create_task(send_task(socket, queue))
        task.add_done_callback(task_done)
        log.debug('Send task for {0} started'.format(_id))

        return (task, queue)

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

    async def handler(self, request):
        """
        Receives HTTP request and negotiates up to a Websocket session
        """

        def task_done(future):
            self.tasks.remove(future)
            exception = future.exception()
            if exception:
                log.warning(
                    'While processing message: {0}\nDetails: {1}'.format(
                        exception,
                        traceback.format_exc())
                )

        client = web.WebSocketResponse(max_msg_size=0)
        client_id = id(client)

        # upgrade to Websockets
        await client.prepare(request)

        log.info('Opening Websocket {0}'.format(id(client)))

        try:
            await client.send_json({
                '$': {'type': CONTROL_MESSAGE, 'monitor': True},
                'root': self.call_and_serialize(lambda: self.root),
                'type': self.call_and_serialize(lambda: type(self.root))
            })
        except Exception:
            log.exception('While sending root info to {0}'.format(client_id))

        try:
            self.clients[client] = self.send_worker(client)
            # Async receive client data until websocket is closed
            async for msg in client:
                task = self.loop.create_task(self.process(msg))
                task.add_done_callback(task_done)
                self.tasks += [task]
        except Exception:
            log.exception('While reading from socket:')
        finally:
            log.info('Closing WebSocket {0}'.format(id(client)))
            await client.close()
            del self.clients[client]

        return client

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

    async def process(self, message):
        try:
            if message.type == aiohttp.WSMsgType.TEXT:
                data = json.loads(message.data)
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
            elif message.type == aiohttp.WSMsgType.ERROR:
                log.error(
                    'WebSocket connection closed unexpectedly: {0}'.format(
                        message))
            else:
                log.warning('Unhandled WSMsgType: {0}'.format(message.type))
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
        for socket, value in self.clients.items():
            task, queue = value
            asyncio.run_coroutine_threadsafe(queue.put(payload), self.loop)


class SystemCalls(object):
    def __init__(self, objects):
        self.objects = objects
        objects[id(self)] = self

    def get_object_by_id(self, id):
        return self.objects[id]
