#!/usr/bin/env python

import aiohttp
import json
import logging
import traceback

from logging.config import dictConfig
from aiohttp import web


# TODO(artyom): might as well use this: https://pypi.python.org/pypi/logging-color-formatter
logging_config = dict(
    version=1,
    formatters={
        'basic': {
            'format': '%(asctime)s %(name)s %(levelname)s [Line %(lineno)s]     %(message)s'  #NOQA
        }
    },
    handlers={
        'debug': {
            'class': 'logging.StreamHandler',
            'formatter': 'basic',
        }
    },
    root={
        'handlers': ['debug'],
        'level': logging.DEBUG,
    }
)
dictConfig(logging_config)

log = logging.getLogger(__name__)
log.setLevel(logging.DEBUG)


# Keep these in sync with ES code
CALL_RESULT_MESSAGE = 0
CALL_ACK_MESSAGE = 1
NOTIFICATION_MESSAGE = 2
CONTROL_MESSAGE = 3


class Foo(object):
    def __init__(self, value):
        self.value = value

    def get_next(self):
        return Foo(self.value + 1)

    def get_value(self):
        return self.value


# TODO(artyom): consider using weak references to avoid memory leaks
# Pros: no memory leaks
# Cons: we actually might want to access instances between sessions.
# In which case they will be garbage collected if they are weak references.
#
class Server(object):
    def __init__(self):
        self.objects = { id(self): self }


    def get_foo(self):
        return Foo(0)


    async def dispatch(self, that, name, args):
        if not that in self.objects:
            raise ValueError('Object with id {0} not found'.format(that))

        obj = self.objects[that]
        function = getattr(type(obj), name)

        if not function:
            raise ValueError(
                'Function {0} not found in {1}'.format(name, type(obj)))

        if not callable(function):
            raise ValueError(
                'Property {0} of {1} is not a function'.format(name, type(obj)))

        res = function(obj, *args)
        self.objects[id(res)] = res

        return res

class ObjectEncoder(json.JSONEncoder):
    def default(self, o):
        log.debug('Serializing {0}'.format(o))
        try:
            res = o.__dict__
        except AttributeError:
            pass
        else:
            return res

        return json.JSONEncoder.default(self, o)

# Let's try using one server for all clients for now and see what happens
# Pros: it can give us an opportunity to display state from multiple clients
# Cons: multiple clients can dispatch calls, memory leaks, how to invalidate state?
server = Server()

def serialize(value):
    res = value.__dict__ if hasattr(value, '__dict__') else value
    return {
        'value': res,
        'type': type(value)
    }

async def handler(request):
    ws = web.WebSocketResponse()

    await ws.prepare(request)

    # Our first message is address of Server instance
    try:
        s = json.dumps({
                '$meta': {
                    'that': id(server),
                    'type': CONTROL_MESSAGE
                },
                'payload': {
                    'value': server,
                    'type': type(server)
                }
            }, cls=ObjectEncoder)
    except e as Exception:
        log.error('While handling call: {0}'.format(e))
    else:
        ws.send_str(s)

    async for msg in ws:
        log.debug('Received: {0}'.format(msg))

        if msg.type == aiohttp.WSMsgType.TEXT:
            data = json.loads(msg.data)

            # Acknowledge the call
            await ws.send_str(json.dumps({
                '$meta': {
                    'id': data['id'],
                    'type': CALL_ACK_MESSAGE
                }
            }))

            try:
                _id = data.pop('id')
                res = await server.dispatch(**data)

                # Send call result
                await ws.send_str(json.dumps({
                    '$meta': {
                        'id': _id,
                        'type': CALL_RESULT_MESSAGE,
                        'that': id(res),
                        'status': 'success',
                    },
                    'payload': serialize(res)
                }, cls=ObjectEncoder))
            except Exception as e:
                log.error('Exception while dispatching a method call: {0}'.format(traceback.format_exc()))
                payload = json.dumps({
                    '$meta': {
                        'id': _id,
                        'type': CALL_RESULT_MESSAGE,
                        'status': 'error',
                    },
                    'payload': str(e)
                })
                ws.send_str(payload)

        elif msg.type == aiohttp.WSMsgType.ERROR:
            log.error(
                'WebSocket connection closed with exception %s' % ws.exception())

    return ws


def start():
    app = web.Application()
    app.router.add_get('/', handler)
    web.run_app(app, host='127.0.0.1', port=31950)


if __name__ == "__main__":
    start()
