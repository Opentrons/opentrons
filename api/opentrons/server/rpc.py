import asyncio
import aiohttp
import functools
import json
import logging
import traceback

from aiohttp import web
from asyncio import Queue
from opentrons.server import serialize
from threading import Thread
from threading import current_thread

log = logging.getLogger(__name__)

# Keep these in sync with ES code
CALL_RESULT_MESSAGE = 0
CALL_ACK_MESSAGE = 1
NOTIFICATION_MESSAGE = 2
CONTROL_MESSAGE = 3
CALL_NACK_MESSAGE = 4


# Wrapper class to dispatch select calls to server
# without exposing the entire server class
class ControlBox(object):
    def __init__(self, server):
        self.server = server

    def get_root(self):
        return self.server.root

    def get_object_by_id(self, id):
        return self.server.objects[id]

    # This is a stub in case the root object doesn't
    # have async iterator
    async def __anext__(self):
        raise StopAsyncIteration

    def __aiter__(self):
        # Return self in case root doesn't provide __aiter__
        res = self
        try:
            res = self.server.root.__aiter__()
        except AttributeError as e:
            log.info(
                '__aiter__ attribute is not defined for {0}'.format(
                    self.server.root))
        finally:
            return res


class Server(object):
    def __init__(self, root=None, loop=None, notification_max_depth=4):
        # All function calls requested will be executed
        # in a separate thread
        # TODO (artyom, 08/22/2017): look into asyncio executors
        # and possibly have multiple executor threads or processes
        def start_background_loop(loop):
            try:
                asyncio.set_event_loop(loop)
                loop.run_forever()
            finally:
                log.info('Exiting from exec thread')
                loop.close()

        self.objects = {id(self): self}
        self.control = ControlBox(self)
        self.notification_max_depth = notification_max_depth

        self.loop = loop or asyncio.get_event_loop()
        self.send_queue = Queue(loop=self.loop)
        self.exec_loop = asyncio.new_event_loop()
        self.monitor_events_task = None

        self._root = None
        self.root = root

        self.clients = []

        self.exec_thread = Thread(
            target=start_background_loop,
            args=(self.exec_loop,))
        self.exec_thread.start()

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

        self._root = value
        self.monitor_events_task = \
            self.loop.create_task(self.monitor_events())

        if hasattr(self._root, 'loop'):
            self._root.loop = self.loop

    def start(self, host, port):
        self.app.on_shutdown.append(self.on_shutdown)
        # This call will block while server is running
        # run_app is capable of catching SIGINT and shutting down
        web.run_app(self.app, host=host, port=port)

    def shutdown(self):
        self.send_loop_task.cancel()
        self.monitor_events_task.cancel()

        if callable(getattr(self._root, 'finalize', None)):
            self.root.finalize()

        self.exec_loop.call_soon_threadsafe(self.exec_loop.stop)

    async def on_shutdown(self, app):
        for ws in self.clients:
            await ws.close(code=WSCloseCode.GOING_AWAY,
                           message='Server shutdown')
        self.shutdown()

    async def send_loop(self):
        log.info('Starting send loop')
        while True:
            client, payload = await self.send_queue.get()
            # see: http://aiohttp.readthedocs.io/en/stable/web_reference.html#aiohttp.web.StreamResponse.drain # NOQA
            await client.drain()
            client.send_str(json.dumps(payload))

    async def monitor_events(self):
        async for event in self.control:
            try:
                # Apply notification_max_depth to control object tree depth
                # during serialization to avoid flooding comms
                data, refs = serialize.get_object_tree(
                    event,
                    self.notification_max_depth)
                self.send(
                    {
                        '$': {'type': NOTIFICATION_MESSAGE},
                        'data': data
                    })
                self.objects.update(refs)
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

        # Return instance of root object and instance of control box
        control_type, control_type_refs = \
            serialize.get_object_tree(type(self.control), max_depth=1)
        control_instance, control_instance_refs = \
            serialize.get_object_tree(self.control, max_depth=1)
        self.objects.update({**control_type_refs, **control_instance_refs})

        self.send(
            {
                '$': {'type': CONTROL_MESSAGE},
                'control': {
                    'instance': control_instance,
                    'type': control_type
                }
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
                token = data.pop('$')['token']
                try:
                    func = self.prepare_call(data)
                    self.send_ack(token)
                except Exception as e:
                    self.send_error(str(e), token)
                else:
                    self.make_call(func, token)
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

    def make_call(self, func, token):
        response = {'$': {'type': CALL_RESULT_MESSAGE, 'token': token}}

        async def call(func):
            try:
                call_result = func()
                log.info('Call result: {0}'.format(call_result))
                response['$']['status'] = 'success'
            except Exception as e:
                log.warning(
                    'Exception while dispatching a method call: {0}'
                    .format(traceback.format_exc()))
                response['$']['status'] = "error"
                call_result = '{0}: {1}'.format(e.__class__.__name__, str(e))
            finally:
                root, refs = serialize.get_object_tree(call_result)
                self.objects.update(refs)
                response['data'] = root
                log.debug('Sending call result from from thread id {0}'.format(
                    id(current_thread())))
                self.send(response)

        log.info('Scheduling a call from thread id {0}'
                 .format(id(current_thread())))
        asyncio.run_coroutine_threadsafe(
            call(func),
            self.exec_loop)

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
