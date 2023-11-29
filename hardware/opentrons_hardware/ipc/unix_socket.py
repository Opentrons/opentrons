import json
import inspect
import argparse
import asyncio

from .dispatcher import Dispatcher, ipc_expose


TYPE_CHOICES = ["server", "client"]
DEFAULT_NAME = "HardwareProc"
DEFAULT_PATH = '/tmp/hardware-proc.socket'
END_MSG_DELIMN = '\n'


class _Method(object):
    """Helper class to represent a remote callable function."""

    def __init__(self, client, path, method):
        """Constructor"""
        self.client = client
        self.path = path
        self.method = method

    async def __call__(self, *args, **kwargs):
        """Send jsonrpc request with our method and arg and return response."""
        req = {
            'type': 'call',
            'path': self.path,
            'name': self.method,
            'args': args,
            'kwargs': kwargs
        }
        return await self.client.send(json.dumps(req))


class IPCProxyObject:
    def __init__(self, path, skeleton, client):
        self._path = path
        self._client = client
        self._skeleton = skeleton

    def __getattr__(self, method):
        print(f"From proxyObj: {method}")
        return _Method(client=self._client, path=self._path, method=method)


class IPCServer():
    def __init__(self, path, name, dispatcher, loop=None) -> None:
        self.path = path
        self.name = name
        self._dispatcher = dispatcher
        self.loop = loop
        self.server = None

        # clients connected
        self._clients = {}
        self.lock = asyncio.Lock()
        self._monitoring = False

    async def start(self) -> None:
        print(f"Starting unix server on {self.path}")
        self.loop = asyncio.get_event_loop()
        self.server = await asyncio.start_unix_server(self.on_connected, path=self.path)
        await self.server.serve_forever()

    async def on_connected(self, reader, writer):
        # client sends its name when it connects
        data = await reader.readline()
        name = data.decode().strip()
        print(f"Client connected: {name}")
        self._clients[name] = (reader, writer)
        await self.send("\n")

        # monitor incoming
        while True:
            print(f"handling {name}")
            data = await reader.readline()
            if data:
                await self._handle_incoming(name, data)
            else:
                # check if the connection is closed
                try:
                    await self.send("\n")
                except ConnectionResetError:
                    break
                await asyncio.sleep(2)

        # The client got disconnected
        print(f"Client disconnected: {name}")
        writer.close()

        # remove the client from list
        del self._clients[name]


    async def _handle_incoming(self, name, data):
        # ignore returns
        if data == b'\n':
            return

        # simple handling for now
        msg = data.decode().strip()
        print(f"Received data: {msg} from {name}")
        clients = {name: self._clients[name]}
        response = None

        try:
            req = json.loads(msg)
        except json.JSONDecodeError:
            print(f"error parsing msg: {msg}")
            return

        cmd = req.get('type')
        path = req.get('path')
        if cmd == 'get_registered':
            # return the list of registered objects by their paths
            response = {"paths": list(self._dispatcher.registered.keys())}
        elif cmd == 'get_proxy':
            # return specifics of object
            if not path:
                response = {"error": f"get_proxy requires an object path."}
            elif self._dispatcher.registered.get(path):
                obj = self._dispatcher.registered.get(path)
                if obj is None:
                    response = {"error": f"Object not found: {path}"}
                else:
                    skeleton = obj.object.__skeleton__
                    print(f"Found object! {skeleton}")
                    response = skeleton
        elif cmd == 'call':
            name = req.get('name')
            if not name:
                response = {'error': f"call requires a valid name: {name}"}
            else:
                path = req.get('path')
                if path is None:
                    response = {"error": f"no object path given for remote call!"}
                else:
                    obj = self._dispatcher.registered.get(path)
                    if obj is None:
                        response = {"error": f"Object not found: {path}"}
                    elif inspect.isfunction(obj.object):
                        print(f"Executing function! {obj.object}")
                        method = obj.object
                        args = req.get('args', ())
                        kwargs = req.get('kwargs', {})
                        if asyncio.iscoroutinefunction(method):
                            response = await method(*args, **kwargs)
                        else:
                            response = method(*args, **kwargs)
                    elif isinstance(obj.object, object) and not inspect.isclass(obj.object):
                        print(f"im an object! {path}")

                        if hasattr(obj.object, name):
                            print(f"found item! {name}")
                            item = getattr(obj.object, name)
                            print(type(item), item, inspect.ismethod(item))

                            if inspect.ismethod(item):
                                method = item
                                print(f"Executing instance function! {method}")
                                args = req.get('args', ())
                                kwargs = req.get('kwargs', {})
                                if asyncio.iscoroutinefunction(method):
                                    response = await method(*args, **kwargs)
                                else:
                                    response = method(*args, **kwargs)
                            else:
                                print("im a property!")
                                response = item
                        
        elif cmd == 'notify':
            print("Got a notify request!")
            self.loop.call_later(5, asyncio.create_task, self.send("DOOR OPEN", clients))
        else:
            response = {}

        if response is not None:
            print(f"sending response: {response}")
            await self.send(json.dumps(response))
    
    async def send(self, msg, clients=None) -> None:
        clients = clients or self._clients
        for name, client in clients.items():
            reader, writer = client
            print(f"Sending to {name}: {msg}")
            msg += '\n'
            writer.write(msg.encode())
            await writer.drain()

        print("Done sending!")


class IPCClient():
    def __init__(self, path, name, loop=None) -> None:
        self.path = path
        self.name = name
        self._loop = loop or asyncio.get_event_loop()
        self._reader = None
        self._writer = None
        self._incoming = None
        self._remote_paths = []

    async def connect(self, serve=True) -> None:
        print(f"Made a connection to: {self.path}")
        self._reader, self._writer = await asyncio.open_unix_connection(path=self.path)
        msg = f"{self.name}\n"
        await self.send(msg)

        # get remote objects
        req = {"type": "get_registered"}
        await self.send(json.dumps(req))
        data = await self._reader.readline()
        self._remote_paths = json.loads(data).get("paths", [])
        print(self._remote_paths)

        if serve:
            await self.serve()

    async def serve(self):
        await self._handle_incoming()

    async def _handle_incoming(self) -> None:
        # todo handle reconnection!
        while(True):
            data = await self._reader.readline()
            msg = data.decode().strip()
            if msg:
                print(f"Got msg: {msg}")
            else:
                await asyncio.sleep(1)

    async def send(self, msg) -> int:
        if None in [self._writer, self._reader]:
            print("Re-establishing Socket connection!")
            await self.connect(serve=False)

        # send encoded message
        msg = msg or ''
        print(f"Sending: {msg}")
        msg += '\n'
        self._writer.write(msg.encode())
        await self._writer.drain()

        # read the response
        data = await self._reader.readline()
        resp = data.decode().strip()
        if resp:
            print(f"received resp: {resp}")
            return json.loads(resp)
            

    async def get_proxy(self, path):
        """Returns a proxy object of the given remote object."""
        print(f"Getting proxy obj for {path}")
        req = {"type": "get_proxy", "path": path}
        resp = await self.send(json.dumps(req))
        if resp:
            print(f"Got resp: {resp}")
            # create proxy
            return IPCProxyObject(path, resp, self)


class Users:
    def __init__(self):
        self._users = {1: {"name": "damon"}, 2: {"name": "john"}}

    def get_users(self):
        return self._users


@ipc_expose
class Test:
    def __init__(self):
        print("Expose Test")
        self._inner = 2
        self._users = Users()

    def something(self):
        return "ok"

    @property
    def inner(self):
        return self._inner

    @property
    def users(self):
        return self._users


async def client_call():
    print("Im a client!")
    client = IPCClient(args.path, args.name)
    await client.connect(serve=False)
    send = await client.send(args.message)
    print(send)


    # lets create a proxy obj
    obj = await client.get_proxy("/Test")
    print(f"I have a proxy obj! {obj}")
    response = await obj.users()
    print(response)


def main(args):
    if args.type == 'client':
       asyncio.run(client_call())
    else:
        dispatcher = Dispatcher()
        test = Test()
        dispatcher.register(test, "/Test")
        dispatcher.register(test.users, "/Test/users")

        server = IPCServer(args.path, args.name, dispatcher)

        asyncio.run(server.start())


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", help="The path of this socket.", default=DEFAULT_PATH)
    parser.add_argument("--name", help="The name of this process.", default=DEFAULT_NAME)
    parser.add_argument("--type", help="Whether this is a server or client.", choices=TYPE_CHOICES, default="server")
    parser.add_argument("--message", help="The message to send.")
    args = parser.parse_args()
    main(args)
