"""This is the server module ipc messenger."""
import json
import argparse
import asyncio

from opentrons_hardware.ipc import (
    ipc_dispatcher,
    JSONRPCDispatcher,
    Dispatcher,
    IPCMessenger,
    SOCKET_PATHNAMES,
)
from opentrons_hardware.ipc.types import (
    IPCProcess,
    JSONRPCRequest,
    JSONRPCBatchRequest,
)

from opentrons_hardware.ipc.dispatcher import ipc_expose, is_exposed





class Test:
    def __init__(self):
        self._item = 1
        print("init Test")
        print(self.__dict__)
    
    def print(self):
        print(self._item)

    @classmethod
    def build(cls):
        print(f"building {cls}")
        return cls()

    @property
    def get_item(self):
        return self._item


@ipc_expose
class IPCInterface:
    def __init__(self):
        pass

    def users(self):
        return self._user._this

@ipc_expose
class User:
    test = None
    def __init__(self, tester):
        print("init user")
        self.test = tester
        self._this = 2
        self._id = 98

    @property
    def get_this(self):
        return self._this
    
    def print(self):
        print(f"User test {self.test}")

    def __repr__(self):
        return f"<{self.__class__.__name__}: id={self._id}>"

    def _private_func(self):
        return 'private'


def main(args):
    @ipc_expose
    def func():
        print("func!")

    @ipc_expose
    async def afunc():
        print("afunc!")

    @ipc_expose
    def echo(data):
        return data


    test = Test()
    user = User(test)
    print(user.__skeleton__)

    dispatcher = Dispatcher()
    dispatcher.register(user, "/hardware/User")
    dispatcher.register(func, "/hardware/func")
    dispatcher.register(afunc, "/hardware/afunc")
    dispatcher.register(echo, "/hardware/echo")

    print("Registered Objects!")
    print(dispatcher.registered)

    source = IPCProcess(args.process)
    path = args.path or SOCKET_PATHNAMES[source]
    print(f"Starting {args.process} on {path}")
    ipc_messenger = IPCMessenger(source, dispatcher, path=path)

    # send direct message if provided
    if args.message:

        #if isinstance(args.message, list):
        #    requests = []
        #    for data in args.message:
        #        requests.append(
        #            JSONRPCRequest(
        #                **data,
        #                is_notification=args.notify,
        #            )
        #        )
        #    req = JSONRPCBatchRequest(*requests)
        #else:
        #    print('here')
        #    req = JSONRPCRequest(
        #        **args.message,
        #        is_notification=args.notify,
        #    )

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
