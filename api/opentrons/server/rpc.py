import asyncio
import aiohttp
import functools
import json
import logging
import traceback

from aiohttp import web
from aiohttp import WSCloseCode
from asyncio import Queue
from opentrons.server import serialize
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


class Server(object):
    def __init__(self, root=None, loop=None):
        self.monitor_events_task = None
        self.loop = loop or asyncio.get_event_loop()
        self.objects = {}
        self.system = SystemCalls(self.objects)

        self.root = root

        # Allow for two concurrent calls max
        self.executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)

        self.clients = {}
        self.tasks = []

        self.app = web.Application(loop=loop)
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
        # This call will block while server is running
        # run_app is capable of catching SIGINT and shutting down
        log.info("Starting server on {}:{}".format(host, port))
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
            exception = future.result()
            if exception:
                log.debug('Send task for socket {0}'.format(_id))
            log.debug('Send task for {0} finished'.format(_id))

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
            except Exception as e:
                log.warning(
                    'While processing event {0}: {1}'.format(
                        event, e))

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

        client = web.WebSocketResponse()
        client_id = id(client)

        # upgrade to Websockets
        await client.prepare(request)

        log.info('Opening Websocket {0}'.format(id(client)))
        log.debug('Tasks: {0}'.format(self.tasks))
        log.debug('Clients: {0}'.format(self.clients))

        try:
            log.debug('Sending root info to {0}'.format(client_id))
            await client.send_json({
                '$': {'type': CONTROL_MESSAGE},
                'root': self.call_and_serialize(lambda: self.root),
                'type': self.call_and_serialize(lambda: type(self.root))
            })
            log.debug('Root info sent to {0}'.format(client_id))
        except Exception as e:
            log.error('While sending root info to {0}: '.format(client_id), e)

        try:
            self.clients[client] = self.send_worker(client)
            # Async receive client data until websocket is closed
            async for msg in client:
                # log.debug('Received: {0}'.format(msg))
                task = self.loop.create_task(self.process(msg))
                task.add_done_callback(task_done)
                self.tasks += [task]
        except Exception as e:
            log.error(
                'While reading from socket: {0}'
                .format(traceback.format_exc()), e)
        finally:
            log.info('Closing WebSocket {0}'.format(id(client)))
            client.close()
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

        log.debug(
            '{0}.{1}({2})'
            .format(obj, name, ', '.join([str(a) for a in args])))

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
                id = a.get('i', None)
                # If it's a compound type (including dict)
                # Check if it has id (i) to determine that it has
                # a reference in object storage. If it's None, then it's
                # a dict originated at the remote
                return self.objects[id] if id else a['v']
            # if array, resolve it's elements
            if isinstance(a, (list, tuple)):
                return [resolve(i) for i in a]
            return a

        return [resolve(a) for a in args]

    async def process(self, message):
        try:
            if message.type == aiohttp.WSMsgType.TEXT:
                data = json.loads(message.data)
                meta = data.pop('$')
                token = meta['token']

                # If no id, or id is null/none/undefined assume
                # a system call to system instance
                if 'id' not in data or data['id'] is None:
                    data['id'] = id(self.system)

                try:
                    _id = data.pop('id', None)
                    func = self.build_call(_id, **data)
                    self.send_ack(token)
                except Exception as e:
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
                log.warning('Unhanled WSMsgType: {0}'.format(message.type))
        except Exception as e:
            log.error('While processing request: {0}'.format(str(e)))

    def call_and_serialize(self, func, max_depth=0):
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
        except Exception as e:
            trace = traceback.format_exc()
            log.warning(
                'Exception while dispatching a method call: {0}'
                .format(trace))
            try:
                line_no = [
                    l.split(',')[0].strip()
                    for l in trace.split('line')
                    if '<module>' in l][0]
            except Exception as exc:
                log.debug(
                    "Exception while getting line no: {}".format(type(exc)))
                line_no = 'unknown'
            response['$']['status'] = 'error'
            call_result = '{0} [line {1}]: {2}'.format(
                e.__class__.__name__, line_no, str(e))
        finally:
            log.debug('Call result: {0}'.format(call_result))
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

    def send(self, payload):
        for socket, value in self.clients.items():
            task, queue = value
            log.debug('Enqueuing {0} for {1}'.format(id(payload), id(socket)))
            asyncio.run_coroutine_threadsafe(queue.put(payload), self.loop)


class SystemCalls(object):
    def __init__(self, objects):
        self.objects = objects
        objects[id(self)] = self

    def get_object_by_id(self, id):
        return self.objects[id]
