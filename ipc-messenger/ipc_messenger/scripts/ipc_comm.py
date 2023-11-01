"""This is the server module ipc messenger."""
import enum
import json
import argparse
import asyncio

from typing import Dict, Any

from ipc_messenger import ipc_dispatcher
from ipc_messenger import IPCMessenger
from ipc_messenger.constants import (
    IPCProcess,
    Destinations,
    DESTINATION_PORT,
    JSONRPCRequest,
)


class OT3Mount(enum.Enum):
    X = 'x'
    Y = 'y'

class OT3Controller:
    def __init__(self):
        pass

    async def home(self):
        print("im homing from controller")
        await asyncio.sleep(2)
        return 'ok'


class OT3API:
    def __init__(self, controller, source, host, port, ipc_messenger = None, destinations = None):
        self._controller = controller
        self._ipc_messenger = ipc_messenger or IPCMessenger(source, host, port, ipc_dispatcher, context={'self': self})
        self._online_process: IPCProcess = dict()
        self._value = 47

    @ipc_dispatcher.add_method(context='self')
    async def home(self):
        print("Homing Gantry")
        return await self._controller.home()

    @ipc_dispatcher.add_method
    async def healthy(online: bool):
        print(f"Im online: {online}")

    @ipc_dispatcher.add_method
    def non_async():
        return "NOTHING"


    @ipc_dispatcher.add_method(context='self')
    async def context(self, this):
        print(f"inside context! {self._value}")

    @ipc_dispatcher.add_method(context='self')
    async def context_return(self, this) -> bool:
        return True

    @ipc_dispatcher.add_method(context='self')
    def get_instruments(self) -> Dict[OT3Mount, Any]:
        return {OT3Mount.X: {"name": "p50"},
                OT3Mount.Y: None}

    @ipc_dispatcher.add_method(context='self')
    async def args_kwargs(self, this: bool, that: str ='that') -> Dict[str, Any]:
        return {"args": this,
                "kwargs": that}

    def get_some(self, this):
        return True


class DummyServer:
    def __init__(self, host, port):
        self._ipc_messenger = IPCMessenger(IPCProcess.SYSTEM_SERVER, host, port, ipc_dispatcher)
        self._ipc_messenger.add_context('self', self)

    @ipc_dispatcher.add_method(context='self')
    def get_something(self):
        pass


def main(args):
    source = IPCProcess(args.process)
    target = [IPCProcess(dest) for dest in args.target] if args.target else list(IPCProcess)
    destination = [dest for dest in target if dest != source]
    print(f"Starting {args.process} on {args.host}:{args.port}")
    #ipc_messenger = IPCMessenger(source, args.host, args.port)
    ot3_controller = OT3Controller()
    ot3_api = OT3API(ot3_controller, source, args.host, args.port)
    ipc_messenger = ot3_api._ipc_messenger

    if args.message:
        #resp = asyncio.run(ot3_api._ipc_messenger.home())
        #print(f"resp: {resp}")

        resp = asyncio.run(ot3_api._ipc_messenger.home())
        print(f"resp: {resp}")


        #req = JSONRPCRequest(
        #    **args.message,
        #    is_notification=args.notify,
        #)
        #resp = asyncio.run(ipc_messenger.send(req, destination, notify=args.notify))
        #print(f"Resp: {resp}")
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

    class Test:
        def __init__(self):
            self._inner = 47

        @ipc_dispatcher.add_method(context='self')
        async def test(self, something, that=None):
            print(something, that, self._inner)

        def another(self, *args, **kwargs):
            print(args, kwargs)

    
    main(args)
    A = Test()
    method = A.test
    args = ("else",)
    kwargs={"that": "that"}


    #asyncio.run(method(*args, **kwargs))
