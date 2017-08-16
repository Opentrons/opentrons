import asyncio
import aiohttp
import json
import logging
import traceback

from aiohttp import web
from opentrons.server import serialize

log = logging.getLogger(__name__)

# Keep these in sync with ES code
CALL_RESULT_MESSAGE = 0
CALL_ACK_MESSAGE = 1
NOTIFICATION_MESSAGE = 2
CONTROL_MESSAGE = 3


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
    def __init__(self, root=None, host='127.0.0.1', port=31950):
        self.objects = {id(self): self}
        self.root = root
        self.host = host
        self.port = port
        self.control = ControlBox(self)
        self.clients = []
        asyncio.ensure_future(self.monitor_events())

    def start(self):
        app = web.Application()
        app.router.add_get('/', self.handler)
        web.run_app(app, host=self.host, port=self.port)

    async def monitor_events(self):
        try:
            async for event in self.control:
                try:
                    data, refs = serialize.get_object_tree(event)
                    self.send(
                        {
                            '$': {'type': NOTIFICATION_MESSAGE},
                            'data': data
                        })
                    self.objects = {**self.objects, **refs}
                except Exception as e:
                    log.warning(
                        'While processing event {0}: {1}'.format(
                            event, e))
        except Exception as e:
            log.warning(
                'While binding to event stream: {0}'.format(
                    e))

    async def handler(self, request):
        """
        Receives HTTP request and negotiates up to
        a Websocket session
        """
        log.debug('Starting handler for request: {0}'.format(request))
        ws = web.WebSocketResponse()

        # upgrade to Websockets
        await ws.prepare(request)

        self.clients.append(ws)

        # Return instance of root object and instance of control box
        control_type, control_type_refs = \
            serialize.get_object_tree(type(self.control), shallow=True)
        control_instance, control_instance_refs = \
            serialize.get_object_tree(self.control, shallow=True)
        self.objects = {
            **self.objects,
            **control_type_refs,
            **control_instance_refs}

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

    async def dispatch(self, id, name, args):
        if id not in self.objects:
            raise ValueError(
                'dispatch: object with id {0} not found'.format(id))

        obj = self.objects[id]
        function = getattr(type(obj), name)
        args = self.resolve_args(args)
        kwargs = {}
        if (len(args) > 0) and (isinstance(args[-1], dict)):
            kwargs = args.pop()

        log.debug(
            'dispatch: will call {0}.{1}({2})'
            .format(obj, name, ', '.join([str(a) for a in args])))

        if not function:
            raise ValueError(
                'Function {0} not found in {1}'.format(name, type(obj)))

        if not callable(function):
            raise ValueError(
                'Attribute {0} of {1} is not a function'
                .format(name, type(obj)))

        return function(obj, *args, **kwargs)

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
        if message.type == aiohttp.WSMsgType.TEXT:
            data = json.loads(message.data)
            token = data.pop('$')['token']
            # Acknowledge the call
            self.send({
                '$': {
                    'token': token,
                    'type': CALL_ACK_MESSAGE
                }
            })
            try:
                msg = {
                    '$': {
                        'token': token,
                        'type': CALL_RESULT_MESSAGE
                    }
                }
                # Replace id with id to be compatible with
                # dispatch's args
                id = data.pop('id', None)
                call_result = await self.dispatch(id, **data)
                msg['$']['status'] = 'success'
            except Exception as e:
                log.warning(
                    'Exception while dispatching a method call: {0}'
                    .format(traceback.format_exc()))
                call_result = '{0}: {1}'.format(type(e).__name__, str(e))
                msg['$']['status'] = 'error'
            finally:
                root, refs = serialize.get_object_tree(call_result)
                self.objects = {**self.objects, **refs}
                msg['data'] = root

                self.send(msg)
        elif message.type == aiohttp.WSMsgType.ERROR:
            log.error(
                'WebSocket connection closed with exception %s'
                % ws.exception())

    def send(self, payload):
        for client in self.clients:
            if client.closed:
                log.warning(
                    'Attempted to send into a closed socket {0}'
                    .format(client))
                continue
            log.warning('Sending {0} to {1}'.format(payload, client))
            client.send_str(json.dumps(payload))
