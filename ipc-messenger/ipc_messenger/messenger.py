"""This is the ipc messenger."""
import json
import asyncio
import logging

from enum import Enum
from typing import Any, Dict, Optional, Set, List


from .constants import JSONRPC_VERSION
from .utils.log import init_logging
from .dispatcher import JSONRPCDispatcher
from .manager import JSONRPCResponseManager
from .types import (
    IPCProcess,
    JSONRPCRequest,
    JSONRPCBatchRequest,
    JSONRPCResponse,
    DESTINATION_PORT,
)

log = logging.getLogger(__name__)
init_logging("DEBUG")


class IPCMessenger:
    class _Method(object):
        def __init__(self, ipc_messenger, method):
            self.ipc_messenger = ipc_messenger
            self.method = method

        async def __call__(self, *args, **kwargs):
            log.info("inside _Method!")
            return await self.ipc_messenger.call(self.method, *args, **kwargs)

    def __init__(
        self,
        source: IPCProcess,
        host: str,
        port: int,
        dispatcher: JSONRPCDispatcher,
        context = None,
        target: Optional[IPCProcess] = None
    ) -> None:
        """Constructor."""
        self._source = source
        self._host = host
        self._port = port
        self._context = context
        self._target = target or list(IPCProcess)

        # register helper with the dispatcher
        self._dispatcher = dispatcher
        async def _get_health() -> bool: return True
        self._dispatcher.add_method(_get_health, name="get_health")
        self._handler = JSONRPCResponseManager(self._dispatcher, context=context)

        # state variables
        self._req_id = 0
        self._server: Optional[asyncio.base_events.Server] = None
        self._online_process: Set[IPCProcess] = set()

    def add_context(self, context_arg: str, context_obj: Any) -> Any:
        """Register a new context arg and its corresponding object."""
        return self._handler.add_context(context_arg, context_obj)

    def remove_context(self, context_arg: str) -> Optional[Any]:
        """Unregister a context arg."""
        return self._handler.remove_context(context_arg)

    @property
    def online_procs(self) -> Set[IPCProcess]:
        """IPCProcesses that are responding to ipc messages."""
        return self._online_process

    async def start(self) -> None:
        """Creates and starts the ipc listener server."""
        self._server = await asyncio.start_server(self._handle_incoming, self._host, self._port)
        # update list of online ipc processes and start the server
        await self.request_health()
        await self._server.serve_forever()

    async def _handle_incoming(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter
    ) -> None:
        """Handler for data sent over asyncio sockets."""
        data = await reader.read()
        message = data.decode()

        # received a message, handle and respond
        log.info(f"Received IPC message: {message}")
        response = await self._handler.handle(message)
        if response:
            log.info(f"Sending IPC response: {response.json}")
            writer.write(response.json.encode())
            await writer.drain()
        writer.close()
        await writer.wait_closed()

    def __getattr__(self, method) -> Any:
        """This will let us call an IPC function as if it were part of this class."""
        return self._Method(ipc_messenger = self, method = method)

    async def call(self, method, *args, **kwargs) -> Any:
        """Call some function and return the output."""
        # remove control key __target if set
        target = None
        if '__target' in kwargs:
            target = kwargs.pop('__target')
            target = target if isinstance(target, list) else [target]

        # deal with args and kwargs
        params = args
        if kwargs:
            params = kwargs
            if args:
                params["__args"] = args

        # create our request
        req = JSONRPCRequest(
            method=method,
            params=params,
            version=JSONRPC_VERSION,
        )

        return await self.send(req, destinations=target)

    async def send(self,
        message: JSONRPCRequest,
        destinations: Optional[List[IPCProcess]] = None,
        notify: bool = False
    ) -> Dict[IPCProcess, Any]:
        """Sends a message to one or more IPCProcesses and return the response."""
        response: Dict[IPCProcess, Any] = dict()
        destinations = destinations or self._target
        for target in destinations:
            # Don't send data to your own process
            if target == self._source:
                continue
            resp = await self._send(target, message, notify=notify)
            response[target] = resp
        return response

    async def _send(
        self,
        target: IPCProcess,
        request: JSONRPCRequest,
        notify: bool = False,
    ) -> Optional[Any]:

        is_batch = isinstance(request, JSONRPCBatchRequest)
        if is_batch:
            for req in request:
                if not notify:
                    self._req_id += 1
                    req._id = self._req_id
        elif not notify:
            # notifications dont have id's
            self._req_id += 1
            request._id = self._req_id

        response: Any = None
        port = DESTINATION_PORT[target]
        log.info(f"Sending: {self._source.name} ({self._host}:{self._port}) -> {target.name} ({self._host}:{port})\n{request}")
        try:
            # open connection to the corresponding port
            reader, writer = await asyncio.open_connection(self._host, port)

            message = request.json
            log.debug(f"sending: {message}")
            writer.write(message.encode())

            # we are done sending data so write EOF
            writer.write_eof()
            await writer.drain()

            # wait for the response if any
            data = await reader.read()

            # close the socket
            writer.close()
            await writer.wait_closed()

            # return the response
            log.debug(f"Received IPC response: {data.decode()}")
            resp =  json.loads(data)
            response = resp if is_batch else resp.get('result')
            # todo (ba, 2023-10-27): raise exception if we get an 'error' response.
        except OSError:
            log.warning(f"{self._host}:{port} is probably offline")
        except json.JSONDecodeError:
            log.error("Received invalid IPC response.")
        except Exception as e:
            log.exception(e)
        return response

    async def request_health(self) -> Set[IPCProcess]:
        """Set of online ipc messengers from other processes."""
        req = JSONRPCRequest(method="get_health")
        responses = await self.send(req)
        online_procs = {proc for proc, online in responses.items() if online}
        self._online_process = online_procs
        return online_procs

