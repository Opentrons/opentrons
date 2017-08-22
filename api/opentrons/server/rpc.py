import asyncio
import aiohttp
import functools
import json
import logging
import traceback

from aiohttp import web
from opentrons.server import serialize
from threading import Thread

log = logging.getLogger(__name__)

# Keep these in sync with ES code
CALL_RESULT_MESSAGE = 0
CALL_ACK_MESSAGE = 1
NOTIFICATION_MESSAGE = 2
CONTROL_MESSAGE = 3
ERROR_MESSAGE = 4


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
    def __init__(self, root=None, loop=None):
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

        self.loop = loop or asyncio.get_event_loop()
        self.exec_loop = asyncio.new_event_loop()
        self.monitor_events_task = None

        self._root = None
        self.root = root

        self.clients = []

        self.exec_thread = Thread(
            target=start_background_loop,
            args=(self.exec_loop,))
        self.exec_thread.start()

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

        if hasattr(self._root, 'set_loop'):
            log.info('Root has set_loop() method. Calling.')
            self._root.set_loop(self.loop)

    def start(self, host, port):
        return web.run_app(self.app, host=host, port=port)

    def stop(self):
        self.monitor_events_task.cancel()

        if hasattr(self.root, 'finalize'):
            self.root.finalize()

        self.exec_loop.call_soon_threadsafe(self.exec_loop.stop)

    async def monitor_events(self):
        async for event in self.control:
            try:
                data, refs = serialize.get_object_tree(event)
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
        Receives HTTP request and negotiates up to
        a Websocket session
        """
        log.debug('Starting handler for request: {0}'.format(request))
        ws = web.WebSocketResponse()

        # upgrade to Websockets
        await ws.prepare(request)

        try:
            ws.set_tcp_cork(True)
        except Exception as e:
            print(e)

        self.clients.append(ws)

        # Return instance of root object and instance of control box
        control_type, control_type_refs = \
            serialize.get_object_tree(type(self.control), shallow=True)
        control_instance, control_instance_refs = \
            serialize.get_object_tree(self.control, shallow=True)
        self.objects.update({**control_type_refs, **control_instance_refs})

        self.send(
            {
                '$': {'type': CONTROL_MESSAGE},
                'control': {
                    'instance': control_instance,
                    'type': control_type
                }
            })

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
                try:
                    func, token = self.prepare_call(message)
                except Exception as e:
                    self.send_error(str(e))
                else:
                    await self.make_call(func, token)
            elif message.type == aiohttp.WSMsgType.ERROR:
                log.error(
                    'WebSocket connection closed unexpectedly: {0}'.format(
                        message))
        except Exception as e:
            log.error('While processing request: {0}'.format(str(e)))

    def prepare_call(self, message):
        try:
            data = json.loads(message.data)
            token = data.pop('$')['token']
            _id = data.pop('id', None)
            func = self.build_call(_id, **data)

            # Acknowledge the call
            self.send_ack(token)
        except Exception as e:
            log.warning('While preparing call: {0}'.format(
                traceback.format_exc()))
            details = '{0}: {1}'.format(e.__class__.__name__, str(e))
            error = (
                "Error handling request: {details}\n"
                "Expected message format:\n"
                "{{'$': {{'token': string}}, 'data': {{'id': int}}") \
                .format(details=details)
            raise RuntimeError(error)

        return (func, token)

    async def make_call(self, func, token):
        response = {'$': {'type': CALL_RESULT_MESSAGE, 'token': token}}

        async def coro(func):
            return func()

        def resolved(future):
            try:
                call_result = future.result()
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
                self.send(response)

        future = asyncio.run_coroutine_threadsafe(
            coro(func),
            self.exec_loop)
        future.add_done_callback(resolved)

    def send_error(self, text):
        self.send({
            '$': {
                'type': ERROR_MESSAGE
            },
            'data': text
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
            log.warning('Sending {0} to {1}'.format(payload, client))
            client.send_str(json.dumps(payload))
