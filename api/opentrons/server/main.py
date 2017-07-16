#!/usr/bin/env python

import aiohttp
import json
import logging

from aiohttp import web
from weakref import ref

log = logging.getLogger(__name__)

CALL_RESULT_MESSAGE = 0
CALL_ACK_MESSAGE = 1
NOTIFICATION_MESSAGE = 2
CONTROL_MESSAGE = 3


class Server:
    def __init__(self):
        self.objects = { id(self): ref(self) }

    async def dispatch(self, _id, name, args):
        if not _id in self.objects:
            raise ValueError('Object with id {0} not found'.format(_id))

        obj = self.objects[_id]
        function = get_attr(obj, name)

        if not function:
            raise ValueError(
                'Function {0} not found in {1}'.format(name, type(obj)))

        if not callable(function):
            raise ValueError(
                'Property {0} of {1} is not a function'.format(name, type(obj)))

        res = function(args)
        self.objects[id(res)] = res

        return res


async def handler(request):
    ws = web.WebSocketResponse()
    server = Server()

    await ws.prepare(request)

    # Our first message is address of Server instance
    ws.send_str(json.dumps({
        'that': id(server),
        'type': CONTROL_MESSAGE
        })
    )

    async for msg in ws:
        print('Received: {0}'.format(msg))

        if msg.type == aiohttp.WSMsgType.TEXT:
            data = json.loads(msg.data)

            # Acknowledge the call
            ws.send_str(json.dumps({
                'id': data['id'],
                'type': CALL_ACK_MESSAGE
            }))

            res = await server.dispatch(
                _id=data['that'],
                name=data['name'],
                args=data['payload'])

            # Send call result
            ws.send_str(json.dumps({
                'id': data['id'],
                'type': CALL_RESULT_MESSAGE,
                'that': id(res),
                'payload': res
            }))
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
