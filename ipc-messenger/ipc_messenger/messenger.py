"""This is the server module ipc messenger."""
import json
import argparse
import asyncio

from enum import Enum
from typing import Any, Dict, List, Optional

from jsonrpc import dispatcher
from jsonrpc.jsonrpc2 import JSONRPC20Request, JSONRPC20Response
from jsonrpc.exceptions import (
    JSONRPCInvalidRequestException,
)

from .manager import JSONRPCResponseManager
from .constants import (
    Destination,
    Destinations,
    DESTINATION_PORT,
)


@dispatcher.add_method
async def no_response():
    print("not responding")


@dispatcher.add_method
async def async_call(data: str):
    print("im waiting echo async")
    await asyncio.sleep(1)
    return {"waited for": data}


@dispatcher.add_method
def echo(data: str):
    return data


def no_response_req():
    return {
        "method": "no_response",
    }

def async_call_req(data: str):
    return {
        "method": "async_call",
        "params": {"data": data},
    }

def echo_req(data:str):
    return {
        "method": "echo",
        "params": {"data": data},
    }


def health_req(online: bool):
    return {
        "method": "health",
        "params": {"online": online},
    }


class IPCMessage(asyncio.Protocol):
    def __init__(self, message, on_con_lost):
        self.message = message
        self.on_con_lost = on_con_lost
        self.response = None

class IPCMessenger:
    def __init__(self, source: Destination, host: str, port: int, destinations: Optional[Destinations] = None):
        self.source = source
        self.host = host
        self.port = port
        self._handler = JSONRPCResponseManager(dispatcher)

        # You cant send messages to yourself
        self._destinations = destinations or list()
        if self.source in self._destinations:
            self._destinations.remove(self.source)

        # setup settings
        self._req_id = 0
        self._server = None

    @property
    def destinations(self) -> List[Destination]:
        return self._destinations

    async def start(self):
        """Creates and starts the ipc listener server."""
        self._server = await asyncio.start_server(self._handle_incoming, self.host, self.port)
        # inform other processes that we are online
        await self.notify_health(True)

        # for testing
        resp = await self.echo("GELLO")
        print(f"echo: {resp}")
        resp = await self.async_call("Something")
        print(f"async: {resp}")

        # run the server
        await self._server.serve_forever()

    async def send(self, data: dict, destinations: Optional[Destinations] = None, notify=False) -> Dict[Destination, Any]:
        """Sends a message to one or more nodes and return the response."""
        response: Dict[Destination, Any] = dict()
        destinations = destinations or self._destinations
        for dest in destinations:
            resp = await self._send(dest, data, notify=notify)
            response[dest] = resp
        return response
    async def _handle_incoming(self, reader, writer):
        data = await reader.read()
        message = data.decode()

        addr = writer.get_extra_info('peername')
        print(f"Received {message!r} from {addr!r}")

        # received a message, handle and respond
        response = await self._handler.handle(data.decode())
        if response:
            writer.write(response.json.encode())
            await writer.drain()

        print("Close the connection")
        writer.close()
        await writer.wait_closed()

    async def _send(
        self,
        destination: Destination,
        data: Dict,
        notify: bool = False,
    ) -> Optional[Any]:
        try:
            request = JSONRPC20Request(
                is_notification=notify,
                **data,
            )
        except JSONRPCInvalidRequestException:
            print("Invalid request")
            return None

        self._req_id += 1
        if not notify:
            request._id = self._req_id

        port = DESTINATION_PORT[destination]
        print(f"Sending: req: {request._id} {self.source.name} ({self.host}:{self.port}) -> {destination.name} ({self.host}:{port})\n{request.json}")
        try:
            # open connection to the corresponding port
            reader, writer = await asyncio.open_connection(self.host, port)

            message = request.json
            print(f'Send: {message!r}')
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
            print(f"Response: {data.decode()}")
            return json.loads(data).get("result")
        except OSError:
            print("probably offline")
            # The node is probably offline
        except json.JSONDecodeError:
            print("Received invalid reponse")
        except Exception as e:
            print(type(e), e)

    # Testing functions
    async def async_call(self, data: str):
        req = async_call_req(data)
        return await self.send(req)

    async def echo(self, data: str) -> Any:
        req = echo_req(data)
        return await self.send(req)

    async def notify_health(self, online: bool):
        req = health_req(online)
        await self.send(req, notify=True)

