"""This is the ipc messenger."""
import json
import asyncio
import logging

from enum import Enum
from typing import Any, Dict, Optional, Set


from .utils.log import init_logging
from .dispatcher import JSONRPCDispatcher
from .manager import JSONRPCResponseManager
from .constants import (
    IPCProcess,
    Destinations,
    DESTINATION_PORT,
    JSONRPCRequest,
    JSONRPCResponse,
)

log = logging.getLogger(__name__)
init_logging("INFO")


class IPCMessenger:
    def __init__(
        self,
        source: IPCProcess,
        host: str,
        port: int,
        dispatcher: JSONRPCDispatcher,
        context=None
    ) -> None:
        """Constructor."""
        self._source = source
        self._host = host
        self._port = port
        self._context = context

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

    async def send(self,
        message: JSONRPCRequest,
        destinations: Optional[Destinations] = None,
        notify: bool = False
    ) -> Dict[IPCProcess, Any]:
        """Sends a message to one or more IPCProcesses and return the response."""
        response: Dict[IPCProcess, Any] = dict()
        destinations = destinations or list(IPCProcess)
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
        self._req_id += 1

        # notifications dont have id's
        if not notify:
            request._id = self._req_id

        response: Any = None
        port = DESTINATION_PORT[target]
        log.info(f"Sending: {self._source.name} ({self._host}:{self._port}) -> {target.name} ({self._host}:{port})\n{request}")
        try:
            # open connection to the corresponding port
            reader, writer = await asyncio.open_connection(self._host, port)

            message = request.json
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
            response = json.loads(data).get('result')
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

