"""This is the server module ipc messenger."""
import json
import argparse
import asyncio

from ipc_messenger.dispatcher import ipc_dispatcher
from ipc_messenger import IPCMessenger
from ipc_messenger.constants import (
    Process,
    Destinations,
    DESTINATION_PORT,
    JSONRPCRequest,
)

class OT3Controller:
    def __init__(self):
        pass

    async def home():
        pass


class OT3API:
    def __init__(self, controller, source, host, port, destination, ipc_messenger = None, destinations = None):
        self._controller = controller
        self._ipc_messenger = ipc_messenger or IPCMessenger(source, host, port, ipc_dispatcher)

    @ipc_dispatcher.add_method
    async def home():
        print("Homing Gantry")
        await asyncio.sleep(1)
        return "ok"

    @ipc_dispatcher.add_method
    async def health(online: bool):
        print(f"Im online: {online}")


def main(args: argparse.Namespace) -> None:
    source = Process(args.process)
    target = [Process(dest) for dest in args.target] if args.target else list(Process)
    destination = [dest for dest in target if dest != source]
    print(f"Starting {args.process} on {args.host}:{args.port}")
    #ipc_messenger = IPCMessenger(source, args.host, args.port, destination)
    ot3_controller = OT3Controller()
    ot3_api = OT3API(ot3_controller, source, args.host, args.port, destination)
    ipc_messenger = ot3_api._ipc_messenger

    if args.message:
        req = JSONRPCRequest(
            **args.message,
            is_notification=args.notify,
        )
        resp = asyncio.run(ipc_messenger.send(req, destination, notify=args.notify))
        print(f"Resp: {resp}")
    else:
        asyncio.run(ipc_messenger.start())

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("process", type=str)
    parser.add_argument("--host", default='localhost')
    parser.add_argument("--port", default=3999)
    parser.add_argument("--target", nargs="*")
    parser.add_argument("--message", type=json.loads)
    parser.add_argument("--notify", action='store_true')

    args = parser.parse_args()
    main(args)
