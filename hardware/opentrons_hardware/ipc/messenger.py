"""This is the ipc messenger."""
import json
import asyncio
import logging

from typing import Any, Dict, Optional, Set, List


from .constants import JSONRPC_VERSION
from .errors import JSONRPCError
from .utils.log import init_logging
from .dispatcher import JSONRPCDispatcher
from .manager import JSONRPCResponseManager
from .types import (
    IPCProcess,
    JSONRPCRequest,
    JSONRPCBatchRequest,
    JSONRPCResponse,
    SOCKET_PATHNAMES,
)

log = logging.getLogger(__name__)
#init_logging("DEBUG")


class IPCMessenger:
    class _Method(object):
        """Helper class to represent a remote callable function."""

        def __init__(self, ipc_messenger, method):
            """Constructor"""
            self.ipc_messenger = ipc_messenger
            self.method = method

        async def __call__(self, *args, **kwargs):
            """Send jsonrpc request with our method and arg and return response."""
            return await self.ipc_messenger.call(self.method, *args, **kwargs)

    def __init__(
        self,
        source: IPCProcess,
        dispatcher: JSONRPCDispatcher,
        path: Optional[str] = None,
        context = None,
        target: Optional[IPCProcess] = None
    ) -> None:
        """Constructor."""
        self._source = source
        self._context = context
        self._path = path or SOCKET_PATHNAMES[source]

        # register helper with the dispatcher
        self._dispatcher = dispatcher
        async def _get_health() -> bool: return True
        self._dispatcher.add_method(_get_health, name="get_health")
        self._handler = JSONRPCResponseManager(self._dispatcher, context=context)

        # state variables
        self._req_id = 0
        self._clients: Dict[IPCProcess, Tuple[Any]] = {}
        self._server: Optional[asyncio.base_events.Server] = None
        self._online_process: Set[IPCProcess] = set()

    @property
    def clients(self) -> Set[IPCProcess]:
        """IPCProcesses that are responding to ipc messages."""
        return set(self._clients)

    async def start(self) -> None:
        """Creates and starts the ipc listener server."""
        self._server = await asyncio.start_unix_server(self._on_connected, path=self._path)
        # update list of online ipc processes and start the server
        # await self.request_health()
        await self._server.serve_forever()

    async def _on_connected(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter
    ) -> None:
        """Handler for data sent over asyncio sockets."""

        # client sends its name when it connects
        data = await reader.readline()
        name = data.decode().strip()
        logger.info(f"Client connected: {name}")
        self._clients[name] = (reader, writer)
        # writer.write("\n".encode())
        await writer.drain()
        await asyncio.sleep(2)

        # monitor incoming
        while True:
            data = await reader.readline()
            message = data.decode().strip()
            if data:
                # received a message, handle and respond
                logger.info(f"Received IPC message: {message}")
                response = await self._handler.handle(message)
                if response:
                    logger.debug(f"Sending IPC response: {response.json}")
                    writer.write(response.json.encode() + b'\n')
                    await writer.drain()
            else:
                # check if the connection is closed
                try:
                    writer.write("\n".encode())
                    await writer.drain()
                except ConnectionResetError:
                    break
                await asyncio.sleep(2)

        # The client got disconnected
        logger.info(f"Client disconnected: {name}")
        writer.close()

        # remove the client from list
        del self._clients[name]

    def add_context(self, context_arg: str, context_obj: Any) -> Any:
        """Register a new context arg and its corresponding object."""
        return self._handler.add_context(context_arg, context_obj)

    def remove_context(self, context_arg: str) -> Optional[Any]:
        """Unregister a context arg."""
        return self._handler.remove_context(context_arg)

    def __getattr__(self, method) -> Any:
        """This will let us call an IPC function as if it were part of this class."""
        return self._Method(ipc_messenger = self, method = method)

    async def call(self, method, *args, **kwargs) -> Any:
        """Call some function and return the output."""
        # remove control key __target if set
        target = None
        if '__target' in kwargs:
            target = kwargs.pop('__target')
            target = target if isinstance(target, list) else [target]

        # deal with args and kwargs
        params = args
        if kwargs:
            params = kwargs
            if args:
                params["__args"] = args

        # create our request
        req = JSONRPCRequest(
            method=method,
            params=params,
            version=JSONRPC_VERSION,
        )
        return await self.send(req, destinations=target)

    async def send(self,
        message: JSONRPCRequest,
        destinations: Optional[List[IPCProcess]] = None,
        notify: bool = False
    ) -> Dict[IPCProcess, Any]:
        """Sends a message to one or more IPCProcesses and return the response."""
        response: Dict[IPCProcess, Any] = dict()
        destinations = destinations or self._target
        for target in destinations:
            # Don't send data to your own process
            if target == self._source:
                continue
            resp = await self._send(target, message, notify=notify)
            if not resp:
                # no response from the process
                response[target] = resp
            elif not resp.error:
                # we got success response from the process
                response[target] = resp.result
            else:
                # we got an error response from the process
                error = JSONRPCError.from_dict(resp.error)
                log.error(f"Received jsonrpc error: {error}")
                if error.data:
                    exc_type = error.data.get('type')
                    exc_msg = error.data.get('message')
                    raise RuntimeError(exc_type, exc_msg)
        return response

    async def _send(
        self,
        target: IPCProcess,
        request: JSONRPCRequest,
        notify: bool = False,
    ) -> Optional[JSONRPCResponse]:
        """Actually sends our request via asyncio sockets and waits for response."""
        is_batch = isinstance(request, JSONRPCBatchRequest)
        if is_batch:
            for req in request:
                if not notify:
                    self._req_id += 1
                    req._id = self._req_id
        elif not notify:
            # notifications dont have id's
            self._req_id += 1
            request._id = self._req_id

        self._req_id = self._req_id % 255

        response: Optional[JSONRPCResponse] = None
        # port = DESTINATION_PORT[target]
        path = SOCKET_PATHNAMES[target]
        logger.debug(f"Sending: {self._source.name} -> {target.name} \n{request}")

        try:
            client = self._clients.get(target)
            if client is None:
                logger.debug(f"Re-connecting to {target}")
                reader, writer = await asyncio.open_unix_connection(path=path)
                msg = f"{self._source.value}\n"
                writer.write(msg.encode())
                await writer.drain()
                await asyncio.sleep(1)
            else:
                # open connection to the corresponding port
                reader, writer = client

            # send out message
            writer.write(request.json.encode() + b'\n')
            await writer.drain()

            # wait for the response if any
            data = await reader.readline()

            # return the response
            logger.debug(f"Received IPC response: {data.decode()}")

            # todo: deal with batch response
            response = JSONRPCResponse.from_json(data)
            response.request = request
        except OSError:
            log.warning(f"{target} is probably offline")
        except json.JSONDecodeError:
            log.error("Received invalid IPC response.")
        except Exception as e:
            log.exception(e)
        return response

    async def request_health(self) -> Set[IPCProcess]:
        """Set of online ipc messengers from other processes."""
        req = JSONRPCRequest(method="get_health")
        responses = await self.send(req)
        online_procs = {proc for proc, online in responses.items() if online}
        self._online_process = online_procs
        return online_procs

