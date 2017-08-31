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
    def __init__(self, root=None, loop=None, notification_max_depth=0):
        self.monitor_events_task = None
        self.loop = loop or asyncio.get_event_loop()

        self.objects = {id(self): self}
        self.control_box = ControlBox(self.objects)

        self.root = root
        self.notification_max_depth = notification_max_depth

        # Allow for two concurrent calls max
        self.executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)

        self.clients = []

        self.send_queue = Queue(loop=self.loop)
        self.send_loop_task = self.loop.create_task(self.send_loop())

        self.app = web.Application()
        self.app.router.add_get('/', self.handler)

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
        self.app.on_shutdown.append(self.on_shutdown)
        # This call will block while server is running
        # run_app is capable of catching SIGINT and shutting down
        web.run_app(self.app, host=host, port=port)

    def shutdown(self):
        self.send_loop_task.cancel()
        self.monitor_events_task.cancel()

    async def on_shutdown(self, app):
        for ws in self.clients:
            await ws.close(code=WSCloseCode.GOING_AWAY,
                           message='Server shutdown')
        self.shutdown()

    async def send_loop(self):
        while True:
            client, payload = await self.send_queue.get()
            # see: http://aiohttp.readthedocs.io/en/stable/web_reference.html#aiohttp.web.StreamResponse.drain # NOQA
            await client.drain()
            client.send_str(json.dumps(payload))

    async def monitor_events(self, instance):
        async for event in instance.notifications:
            try:
                # Apply notification_max_depth to control object tree depth
                # during serialization to avoid flooding comms
                data = self.call(
                    lambda: event,
                    max_depth=self.notification_max_depth)
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
        log.debug('Starting handler for request: {0}'.format(request))
        ws = web.WebSocketResponse()

        # upgrade to Websockets
        await ws.prepare(request)
        self.clients.append(ws)

        self.send({
            '$': {'type': CONTROL_MESSAGE},
            'root': self.call(lambda: self.root),
            'type': self.call(lambda: type(self.root))
        })

        try:
            # Async receive ws data until websocket is closed
            async for msg in ws:
                log.debug('Received: {0}'.format(msg))
                try:
                    await self.process(msg)
                except Exception as e:
                    await ws.close()
                    log.warning(
                        'While processing message: {0}'
                        .format(traceback.format_exc()))
        except Exception as e:
            log.error(
                'While reading from socket: {0}'
                .format(traceback.format_exc()))
        finally:
            self.clients.remove(ws)

        return ws

    def build_call(self, _id, name, args):
        if _id not in self.objects:
            raise ValueError(
                'build_call(): object with id {0} not found'.format(_id))

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
            'build_call(): will call {0}.{1}({2})'
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
                # a system call to control_box instance
                if 'id' not in data or data['id'] is None:
                    data['id'] = id(self.control_box)

                try:
                    func = self.prepare_call(data)
                    self.send_ack(token)
                except Exception as e:
                    self.send_error(str(e), token)
                else:
                    response = await self.make_call(func, token)
                    self.send(response)
            elif message.type == aiohttp.WSMsgType.ERROR:
                log.error(
                    'WebSocket connection closed unexpectedly: {0}'.format(
                        message))
        except Exception as e:
            log.error('While processing request: {0}'.format(str(e)))

    def prepare_call(self, data):
        try:
            _id = data.pop('id', None)
            func = self.build_call(_id, **data)
        except Exception as e:
            log.warning('While preparing call: {0}'.format(
                traceback.format_exc()))
            details = '{0}: {1}'.format(e.__class__.__name__, str(e))
            raise RuntimeError(details)
        return func

    def call(self, func, max_depth=0):
        call_result = func()
        serialized, refs = serialize.get_object_tree(
            call_result, max_depth=max_depth)
        self.objects.update(refs)
        return serialized

    async def make_call(self, func, token):
        def call(func):
            response = {'$': {'type': CALL_RESULT_MESSAGE, 'token': token}}
            try:
                call_result = self.call(func)
                response['$']['status'] = 'success'
            except Exception as e:
                log.warning(
                    'Exception while dispatching a method call: {0}'
                    .format(traceback.format_exc()))
                response['$']['status'] = 'error'
                call_result = '{0}: {1}'.format(e.__class__.__name__, str(e))
            finally:
                log.info('Call result: {0}'.format(call_result))
                response['data'] = call_result
            return response

        return await self.loop.run_in_executor(self.executor, call, func)

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
        for client in self.clients:
            if client.closed:
                log.warning(
                    'Attempted to send into a closed socket {0}'
                    .format(client))
                continue
            log.info('Enqueuing {0} for {1}'.format(payload, client))
            asyncio.run_coroutine_threadsafe(
                self.send_queue.put((client, payload)), self.loop)


class ControlBox(object):
    def __init__(self, objects):
        self.objects = objects
        objects[id(self)] = self

    def get_object_by_id(self, id):
        return self.objects[id]
