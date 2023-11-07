"""This is the server module ipc messenger."""
import json
import argparse
import asyncio

from opentrons_hardware.ipc import (
    ipc_dispatcher,
    IPCMessenger,
)
from opentrons_hardware.ipc.types import (
    IPCProcess,
    JSONRPCRequest,
    JSONRPCBatchRequest,
)


def main(args):
    source = IPCProcess(args.process)
    target = [IPCProcess(dest) for dest in args.target] if args.target else list(IPCProcess)
    destination = [dest for dest in target if dest != source]
    print(f"Starting {args.process} on {args.host}:{args.port}")
    ipc_messenger = IPCMessenger(source, args.host, args.port, ipc_dispatcher)

    # send direct message if provided
    if args.message:
        if isinstance(args.message, list):
            requests = []
            for data in args.message:
                requests.append(
                    JSONRPCRequest(
                        **data,
                        is_notification=args.notify,
                    )
                )
            req = JSONRPCBatchRequest(*requests)
        else:
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
