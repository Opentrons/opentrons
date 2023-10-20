"""This is the server module ipc messenger."""
import json
import argparse
import asyncio

from enum import Enum
from typing import Any, Dict, List, Optional

from jsonrpc import JSONRPCResponseManager, dispatcher
from jsonrpc.jsonrpc2 import JSONRPC20Request, JSONRPC20Response
from jsonrpc.exceptions import (
    JSONRPCInvalidRequest,
    JSONRPCInvalidRequestException,
)

class Destination(Enum):
    HARDWARE = "hardware"
    ROBOT_SERVER = "robot_server"
    SYSTEM_SERVER = "system_server"


DESTINATION_PORT = {
    Destination.HARDWARE: 4000,
    Destination.ROBOT_SERVER: 4001,
    Destination.SYSTEM_SERVER: 4002,
}

Destinations = List[Destination]


@dispatcher.add_method
async def async_call(data: str):
    print("im waiting echo async")
    asyncio.sleep(1)
    return {"waited for": data}


@dispatcher.add_method
def echo(data: str):
    return data


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

    def connection_made(self, transport):
        # print("Made server connection")
        transport.write(self.message.encode())

    def data_received(self, data):
        print('Data received: {!r}'.format(data.decode()))
        try:
            self.response = json.loads(data).get("result")
        except json.JSONDecodeError:
            print("Received invalid reponse")
            pass

    def connection_lost(self, exc):
        # print('The server closed the connection')
        self.on_con_lost.set_result(True)


class IPCTx:
    def __init__(self, source: Destination, host: str, port: int, loop = None):
        self.source = source
        self.host = host
        self.port = port
        self._loop = loop
        self._req_id = 0

    async def send(self, destination: Destination, data: Dict, notify: bool = False):
        self._loop = asyncio.get_running_loop()
        try:
            request = JSONRPC20Request(
                is_notification=notify,
                **data,
            )
        except JSONRPCInvalidRequestException:
            print("Invalid data")
            return None

        self._req_id += 1
        request._id = self._req_id
        port = DESTINATION_PORT[destination]
        print(f"Sending: req: {request._id} {self.source.name} ({self.host}:{self.port}) -> {destination.name} ({self.host}:{port})\n{request.json}")
        on_con_lost = self._loop.create_future()
        try:
            transport, protocol = await self._loop.create_connection(
            lambda: IPCMessage(request.json, on_con_lost),
            self.host, port)
            await on_con_lost
            transport.close()

            # return the response
            return protocol.response
        except Exception as e:
            # The node is probably offline
            pass

class IPCRx(asyncio.Protocol):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def connection_made(self, transport):
        print(f"Connected: {transport.get_protocol()}")
        self.transport = transport

    def data_received(self, data):
        print(f"Received: {data.decode()}")

        asyncio.create_task
        response = JSONRPCResponseManager.handle(
        data.decode(), dispatcher)
        if response:
            print(f"Sending: {response.json}")
            self.transport.write(response.json.encode())

        print('Close the client socket')
        self.transport.close()


class IPCMessenger:
    def __init__(self, source: Destination, host: str, port: int, destinations: Optional[Destinations] = None, loop = None):
        self.source = source
        self.host = host
        self.port = port
        self._destinations = destinations or list()

        # setup settings
        self._req_id = 0
        self._loop = None
        self._server = None
        self._tx = IPCTx(self.source, self.host, self.port, self._loop)
        self.setup()

    @property
    def destinations(self) -> List[Destination]:
        return self._destinations

    def setup(self):
        # You cant send messages to yourself
        if self.source in self._destinations:
            self._destinations.remove(self.source)
        print(f"Destinations: {self._destinations}")

    async def handle_client(self, reader, writer):
        try:
            data = await reader.readuntil(jsonrpc.protocol.BODY_SEPARATOR)
            message = data.decode('utf-8').rstrip('\r\n')
            response = JSONRPCResponseManager.handle(message, dispatcher)
        except JSONRPCDispatchException as e:
            response = e.error_respond()
        except Exception as e:
            print(f"Error handling request: {e}")
            response = JSONRPCResponseManager.error_respond(0, str(e))

        writer.write(response.encode('utf-8'))
        await writer.drain()
        writer.close()

    async def start(self):
        self._loop = asyncio.get_running_loop()
        self._server = await self._loop.create_server(IPCRx, self.host, self.port)
        resp = await self.notify_health(True)
        print("notify: {resp}")

        resp = await self.echo("GELLO")
        print("echo: {resp}")

        resp = await self.async_call("Something")
        print(f"async: {resp}")

        await self._server.serve_forever()

    async def async_call(self, data: str):
        req = async_call_req(data)
        return await self.send(req)

    async def echo(self, data: str) -> Any:
        req = echo_req(data)
        return await self.send(req)

    async def notify_health(self, online: bool):
        req = health_req(online)
        await self.send(req, notify=True)

    async def send(self, data: dict, destinations: Optional[Destinations] = None, notify=False):
        """Sends a message to one or more destinations"""
        response = {}
        destinations = destinations or self._destinations
        for dest in destinations:
            print(dest)
            resp = await self._tx.send(dest, data, notify=notify)
            response[dest] = resp
        print(f"Response: {response}")
        return response


class OT3Controller:
    def __init__(self):
        self.door_state = 1
        self.nodes = ["x", "y"]

    async def home(self, Axis = None):
        print(f"Homeing Axis: {Axis}")
        await asyncsio.sleep(1)

    def notify(self, event: str):
        return {"door": "open"}


class OT3API:
    def __init__(self, ipc_messenger, ot3_controller):
        self.ipc_messenger = ipc_messenger
        self.backend = ot3_controller

    async def home(self):
        await self.backend.home(["X", "Y"])

    def notify(self, destination: Destination, data: str):
        self.ipc_messenger.send(destination, data)

def main(args):
    source = Destination(args.source)
    destination = [Destination(dest) for dest in args.destination] if args.destination else list(Destination)
    destination = [dest for dest in destination if dest != source]
    print(f"Starting {args.source} on {args.host}:{args.port}")
    ipc_messenger = IPCMessenger(source, args.host, args.port, destination)
    ot3_controller = OT3Controller()
    ot3_api = OT3API(ipc_messenger, ot3_controller)
    if args.message:
        asyncio.run(ipc_messenger.send(args.message, destination))
    else:
        asyncio.run(ipc_messenger.start())

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=str)
    parser.add_argument("--host", default='localhost')
    parser.add_argument("--port", default=4000)
    parser.add_argument("--destination", nargs="*")
    parser.add_argument("--message", type=json.loads)

    args = parser.parse_args()
    main(args)

