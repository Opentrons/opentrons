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

from ipc_messenger import IPCMessenger
from ipc_messenger.constants import (
    Destination,
    Destinations,
    DESTINATION_PORT,
)

def main(args):
    source = Destination(args.source)
    destination = [Destination(dest) for dest in args.destination] if args.destination else list(Destination)
    destination = [dest for dest in destination if dest != source]
    print(f"Starting {args.source} on {args.host}:{args.port}")
    ipc_messenger = IPCMessenger(source, args.host, args.port, destination)
    #ot3_controller = OT3Controller()
    #ot3_api = OT3API(ipc_messenger, ot3_controller)
    if args.message:
        print(f"notify: {args.notify}")
        resp = asyncio.run(ipc_messenger.send(args.message, destination, notify=args.notify))
        print(f"resp: {resp}")
    else:
        asyncio.run(ipc_messenger.start())

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=str)
    parser.add_argument("--host", default='localhost')
    parser.add_argument("--port", default=4000)
    parser.add_argument("--destination", nargs="*")
    parser.add_argument("--message", type=json.loads)
    parser.add_argument("--notify", action='store_true')

    args = parser.parse_args()
    main(args)
