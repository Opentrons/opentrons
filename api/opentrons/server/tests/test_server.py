import json
import asyncio
from aiohttp import WSMsgType
from opentrons.server import main
import pytest


class Message(object):
    def __init__(self, **kwargs):
        [setattr(self, k, v) for k, v in kwargs.items()]


@pytest.fixture
def ws(monkeypatch):
    from aiohttp import web
    queue = []
    socket = None

    def init(value):
        queue.clear()
        queue.extend([
            Message(data=json.dumps(data), type=WSMsgType.TEXT) 
            for data in value])
        socket = WebSocket(queue)
        return socket

    class WebSocket(object):
        def __init__(self, messages):
            self.sent = []
            self.received = messages
            self.sync = asyncio.Condition()

        async def read(self):
            self.sync.wait_for(len(self.sent) > 1)
            return self.sent

        async def prepare(self, request):
            self.request = request

        async def send_str(self, s):
            self.sent.append(s)

        def __aiter__(self):
            return self

        async def __anext__(self):
            try:
                return self.received.pop()
            except:
                raise StopAsyncIteration

    def create_ws():
        return socket

    monkeypatch.setattr(web, 'WebSocketResponse', create_ws)

    return init

@pytest.mark.asyncio
async def test_init(ws):
    ws = ws([{'id': 1}])
    main.handler(None)
    print(await ws.read())
    assert False