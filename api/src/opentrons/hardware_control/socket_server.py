""" A server that can listen on a local socket and provide serialized access
to a hardware controller.
"""

import asyncio
import json
import logging
from typing import Any, Callable, Optional, Set

from . import API

LOG = logging.getLogger()


class JsonStreamDecoder:
    def __init__(self, reader: asyncio.StreamReader):
        self._reader = reader
        self._buf = b''
        self._decoder = json.JSONDecoder()

    async def read_object(self) -> Any:
        while True:
            self._buf += await self._reader.read(1)
            try:
                decoded, offset = self._decoder.raw_decode(self._buf.decode())
            except json.JSONDecodeError:
                pass
            else:
                self._buf = self._buf[offset:]
                return decoded


class Server:
    def __init__(self, api: API,
                 loop: asyncio.AbstractEventLoop):
        self._api = api
        self._loop = loop
        self.server: Optional[Any] = None
        self._protocol_instances: Set['JsonRpcProtocol'] = set()

    def _build_protocol(self):
        proto = JsonRpcProtocol(self._api, self._loop, self._unregister)
        self._protocol_instances.add(proto)
        return proto

    def _unregister(self, protocol: 'JsonRpcProtocol') -> None:
        try:
            self._protocol_instances.remove(protocol)
        except KeyError:
            LOG.warning('protocol not present on unregister - double call?')

    async def start(self, sock_path: str):
        assert not self.server, 'Server already running'
        self.server = await self._loop.create_unix_server(
            self._build_protocol,
            sock_path)

    async def stop(self):
        if self.server:
            self.server.close()
            self.server = None
        self._protocol_instances.clear()


async def dispatch(call_str: str) -> str:
    data = json.loads(call_str)
    LOG.info(data)
    await asyncio.sleep(0.1)
    return call_str


def _build_jrpc_error(message, exc) -> str:
    return json.dumps({'jsonrpc': '2.0', 'id': None,
                       'error': {'code': -32063,  # jsonrpc internal error
                                 'message': message,
                                 'data': repr(exc)}})


class JsonRpcProtocol(asyncio.Protocol):
    def __init__(self, api: API,
                 loop: asyncio.AbstractEventLoop,
                 on_close: Callable[['JsonRpcProtocol'], None]):
        self._api = api
        self._loop = loop
        self._log = LOG.getChild('jsonrpc')
        self._decoder = json.JSONDecoder()
        self._buffer = ''
        self._transport: Optional[asyncio.Transport] = None
        self._inflight: Set[asyncio.Future] = set()
        self._onclose = on_close

    def connection_made(self, transport):
        self._log.info("Conection made")
        self._transport = transport

    def connection_lost(self, exc):
        self._transport = None
        self._log.info(f"Connection lost: {exc}")
        for task in self._inflight:
            task.cancel()
        self._onclose(self)

    def pause_writing(self):
        self._log.debug('pause writing')

    def resume_writing(self):
        self._log.debug('resume writing')

    def data_received(self, data: bytes):
        self._log.debug(f'data received: {data}')
        self._buffer += data.decode()  # hope this isn't incomplete
        try:
            _, pos = self._decoder.raw_decode(self._buffer)
        except json.JSONDecodeError:
            # If someone sends us garbage that isn't valid json, we need to
            # not get stuck in a bad state. If we're always accumulating data
            # until we no longer get an error, then consider if the first thing
            # we saw was "aaaaaaaa" - this would always be invalid because it's
            # impossible to make it valid json just by adding more data.
            # Since we are only accepting jsonrpc, every message should be an
            # object and therefore should start with {.
            if self._buffer[0] != '{':
                obj_start = self._buffer.find('{')
                if obj_start == -1:
                    # There is no '{' character in the buffer, wait for more
                    # data
                    return
                else:
                    # Recurse now that we've made the buffer safe
                    self._buffer = self._buffer[obj_start:]
                    return self.data_received(b'')
        to_dispatch = self._buffer[:pos]
        self._buffer = self._buffer[pos:]
        task = self._loop.create_task(dispatch(to_dispatch))
        self._inflight.add(task)

        def done_callback(fut):
            try:
                res = fut.result()
            except asyncio.InvalidStateError:
                pass
            except asyncio.CancelledError as e:
                self._log.error("jsonrpc invocation cancelled")
                self._transport.write(
                    _build_jrpc_error('execution cancelled', e).encode())
            except Exception as e:
                self._log.exception('Uncaught exception in jsonrpc dispatch')
                self._transport.write(
                    _build_jrpc_error('uncaught exception in dispatch',
                                      e).encode())
            else:
                if self._transport:
                    self._transport.write(res.encode())
            finally:
                self._inflight.remove(task)

        task.add_done_callback(done_callback)

    def eof_received(self):
        self._log.info(f'eof received')
        for task in self._inflight:
            task.cancel()

    def __del__(self):
        self._log.debug("goodbye")


async def run(sock_path: str,
              api: API) -> Server:
    """ Run the socket server.

    This method yields control back to the caller after starting
    the server, which runs in the loop itself. It returns the server
    object.
    """
    loop = asyncio.get_event_loop()
    server = Server(api, loop)
    await server.start(sock_path)
    return server
