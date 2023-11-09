"""This is the server module ipc messenger."""
import json
import argparse
import asyncio

from opentrons_hardware.ipc import (
    ipc_dispatcher,
    IPCMessenger,
    SOCKET_PATHNAMES,
)
from opentrons_hardware.ipc.types import (
    IPCProcess,
    JSONRPCRequest,
    JSONRPCBatchRequest,
)


def main(args):
    source = IPCProcess(args.process)
    path = args.path or SOCKET_PATHNAMES[source]
    print(f"Starting {args.process} on {path}")
    ipc_messenger = IPCMessenger(source, ipc_dispatcher, path=path)

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

        targets = [IPCProcess(proc) for proc in args.target]
        resp = asyncio.run(ipc_messenger.send(req, targets, notify=args.notify))
        print(f"Resp: {resp}")
    else:
        asyncio.run(ipc_messenger.start())

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("process", type=str)
    parser.add_argument("--path", type=str)
    parser.add_argument("--target", nargs="*")
    parser.add_argument("--message", type=json.loads)
    parser.add_argument("--notify", action='store_true')

    args = parser.parse_args()
    main(args)
