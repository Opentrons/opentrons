"""This is the ipc messenger."""
import json
import asyncio

from enum import Enum
from typing import Any, Dict, Optional, Set

from .dispatcher import JSONRPCDispatcher
from .manager import JSONRPCResponseManager
from .constants import (
    Process,
    Destinations,
    DESTINATION_PORT,
    JSONRPCRequest,
    JSONRPCResponse,
)


class IPCMessenger:
    def __init__(
        self,
        source: Process,
        host: str,
        port: int,
        dispatcher: JSONRPCDispatcher,
    ) -> None:
        """Constructor."""
        self._source = source
        self._host = host
        self._port = port

        # register helper with the dispatcher
        self._dispatcher = dispatcher
        async def _get_health() -> bool: return True
        self._dispatcher.add_method(_get_health, name="get_health")
        self._handler = JSONRPCResponseManager(self._dispatcher)

        # state variables
        self._req_id = 0
        self._server: Optional[asyncio.base_events.Server] = None
        self._online_process: Set[Process] = set()

    @property
    def online_procs(self) -> Set[Process]:
        """Processes that are responding to ipc messages."""
        return self._online_process

    async def start(self) -> None:
        """Creates and starts the ipc listener server."""
        self._server = await asyncio.start_server(self._handle_incoming, self._host, self._port)
        # update list of online ipc processes and start the server
        await self.request_health()
        print(f"Online procs: {self.online_procs}")
        await self._server.serve_forever()

    async def _handle_incoming(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter
    ) -> None:
        """Handler for data sent over asyncio sockets."""
        data = await reader.read()
        # received a message, handle and respond
        response = await self._handler.handle(data.decode())
        if response:
            writer.write(response.json.encode())
            await writer.drain()

        print("Close the connection")
        writer.close()
        await writer.wait_closed()

    async def send(self,
        message: JSONRPCRequest,
        destinations: Optional[Destinations] = None,
        notify: bool = False
    ) -> Dict[Process, Any]:
        """Sends a message to one or more Processes and return the response."""
        response: Dict[Process, Any] = dict()
        destinations = destinations or list(Process)
        for target in destinations:
            # Don't send data to your own process
            if target == self._source:
                continue
            resp = await self._send(target, message, notify=notify)
            response[target] = resp
        return response

    async def _send(
        self,
        target: Process,
        request: JSONRPCRequest,
        notify: bool = False,
    ) -> Optional[Any]:
        self._req_id += 1

        # notifications dont have id's
        if not notify:
            request._id = self._req_id

        response: Any = None
        port = DESTINATION_PORT[target]
        print(f"Sending: {self._source.name} ({self._host}:{self._port}) -> {target.name} ({self._host}:{port})\n{request}")
        try:
            # open connection to the corresponding port
            reader, writer = await asyncio.open_connection(self._host, port)

            message = request.json
            print(f'Send: {message}')
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
            print(f"Receive: {data.decode()}")
            reponse = json.loads(data).get("result")
        except OSError:
            print("probably offline")
        except json.JSONDecodeError:
            print("Received invalid reponse")
        except Exception as e:
            print(e)
        return response

    async def request_health(self) -> Set[Process]:
        """Set of online ipc messengers from other processes."""
        req = JSONRPCRequest(method="get_health")
        responses = await self.send(req)
        online_procs = {proc for proc, online in responses.items() if online}
        self._online_process = online_procs
        return online_procs

