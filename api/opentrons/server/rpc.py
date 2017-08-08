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

    def get_object_by_id(self, _id):
        return self.server.objects[_id]

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

    def start(self):
        app = web.Application()
        app.router.add_get('/', self.handler)
        web.run_app(app, host=self.host, port=self.port)

    # If arguments have references to local objects
    # resolve them into these instances
    def resolve_args(self, args):
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

    async def dispatch(self, _id, name, args):
        if _id not in self.objects:
            raise ValueError(
                'dispatch: object with id {0} not found'.format(_id))

        obj = self.objects[_id]
        function = getattr(type(obj), name)
        args = self.resolve_args(args)

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

        res = function(obj, *args)
        return res

    async def process(self, message, send):
        if message.type == aiohttp.WSMsgType.TEXT:
            data = json.loads(message.data)
            token = data.pop('$')['token']
            # Acknowledge the call
            await send({
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
                # Replace id with _id to be compatible with
                # dispatch's args
                _id = data.pop('id', None)
                res = await self.dispatch(_id, **data)
                msg['$']['status'] = 'success'
            except Exception as e:
                log.warning(
                    'Exception while dispatching a method call: {0}'
                    .format(traceback.format_exc()))
                res = '{0}: {1}'.format(type(e).__name__, str(e))
                msg['$']['status'] = 'error'
            finally:
                root, refs = serialize.get_object_tree(res)
                self.objects = {**self.objects, **refs}
                msg['data'] = root
                await send(msg)
        elif message.type == aiohttp.WSMsgType.ERROR:
            log.error(
                'WebSocket connection closed with exception %s'
                % ws.exception())

    async def monitor_events(self, send):
        try:
            async for event in self.control:
                try:
                    data, refs = serialize.get_object_tree(event)
                    await send(
                        {
                            '$': {'type': NOTIFICATION_MESSAGE},
                            'data': data
                        })
                    self.objects = {**self.objects, **refs}
                except Exception as e:
                    print(
                        'While processing event {0}: {1}'.format(
                            event, e))
        except Exception as e:
            print(
                'While binding to event stream: {0}'.format(
                    e))

    # Handler receives HTTP request and negotiates up to
    # a websocket session
    async def handler(self, request):
        log.debug('Starting handler for request: {0}'.format(request))
        ws = web.WebSocketResponse()

        # upgrade to websockets
        await ws.prepare(request)

        def send(payload):
            log.debug('Sending {0} to {1}'.format(payload, ws))
            return ws.send_str(json.dumps(payload))

        # Return instance of root object and instance of control box
        control_type, control_type_refs = serialize.get_object_tree(
            type(self.control), shallow=True)
        control_instance, control_instance_refs = serialize.get_object_tree(
            self.control, shallow=True)
        self.objects = {
            **self.objects,
            **control_type_refs,
            **control_instance_refs}

        await send(
            {
                '$': {'type': CONTROL_MESSAGE},
                'control': {
                    'instance': control_instance,
                    'type': control_type
                }
            })

        events = None
        # Start a loop listening for root object events
        try:
            asyncio.ensure_future(self.monitor_events(send))
        except Exception as e:
            print(e)

        # Async receive ws data until websocket is closed
        async for msg in ws:
            log.debug('Received: {0}'.format(msg))
            try:
                await self.process(msg, send)
            except Exception as e:
                await ws.close()
                log.error(
                    'Exception while processing message: {0}'
                    .format(traceback.format_exc()))

        return ws
