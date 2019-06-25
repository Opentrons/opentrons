import asyncio
import functools
import inspect
import json
import logging
from types import MethodType
from typing import Any, Callable, Dict, List, NamedTuple, Optional, Union

from jsonrpcclient.async_client import AsyncClient
from jsonrpcclient.response import Response, SuccessResponse

from .socket_server import serializer_for, deserializer_for
from .types import HardwareAPILike
from . import API

LOG = logging.getLogger(__name__)


class JsonStreamDecoder:
    def __init__(self, reader: asyncio.StreamReader) -> None:
        self._reader = reader
        self._buf = b''
        self._decoder = json.JSONDecoder()

    async def read_object(self) -> Any:
        while True:
            self._buf += await self._reader.read(1)
            try:
                decoded, offset = self._decoder.raw_decode(self._buf.decode())
            except json.JSONDecodeError:
                pass
            else:
                self._buf = self._buf[offset:]
                return decoded


class Transforms(NamedTuple):
    arg_xforms: Dict[str, Callable[[Any], Any]]
    return_xform: Callable[[Any], Any]


def _build_function_type_transforms(function_name: str,
                                    func: Callable) -> Transforms:
    """
    Build a data structure describing how to serialize function calls

    This will contain functions to serialize arguments and deserialize
    returns. It is similar in concept to
    :py:meth:`socket_server._build_serializable_method`, but isn't focused
    on building callable wrappers since we'll use it in our override of
    :py:meth:`jsonrpcclient.async_client.send` directly.

    This should be called on pairs of `function_name`, `function_object`
    parsed from the list of function attributes of the API class. The
    function objects must be fully annotated for this to work.
    """
    sig = inspect.signature(func)
    return_xform = deserializer_for(sig.return_annotation)

    arg_xforms = {}
    for argname, param in sig.parameters.items():
        # Since this is (or might be) inspecting a class, the function won't
        # be a bound method but a free function attribute that has a self arg.
        # we should ignore this, since in practice it won't be at the callsite
        if argname == 'self':
            continue
        arg_xforms[argname] = serializer_for(param.annotation)
    return Transforms(arg_xforms=arg_xforms,
                      return_xform=return_xform)


def _apply_arg_transforms(
        request_dict: Dict[str, Any], xforms: Transforms) -> Dict[str, Any]:
    assert isinstance(request_dict, dict),\
        'Positional params are not supported'
    return {
        name: xforms.arg_xforms.get(name, lambda x: x)(value)
        for name, value in request_dict.items()
    }


def build_funcmap(klass,
                  pred=None) -> Dict[str, Transforms]:
    """ Inspect a class object and build a map of transforms for each function
    (ignoring self)
    """
    def should_scrape(fobj):
        return inspect.isfunction(fobj) and not fobj.__name__.startswith('_')
    if not pred:
        pred = should_scrape
    return {
        fname: _build_function_type_transforms(fname, fobj)
        for fname, fobj in inspect.getmembers(klass, pred)
    }


class UnixSocketClient(AsyncClient):
    """
    jsonrpc async client implementation based on jsonrpc.clients.socket_client
    """

    class _Connection:
        def __init__(self, socket_path, reader, writer):
            self.socket_path = socket_path
            self.reader = reader
            self.writer = writer
            self.decoder = JsonStreamDecoder(reader)

    def __init__(self) -> None:
        self._connection: Optional[UnixSocketClient._Connection] = None
        self._funcmap = build_funcmap(API)

    @classmethod
    async def build(
            cls,
            socket_path: str) -> 'UnixSocketClient':
        obj = cls()
        await obj.connect(socket_path)
        return obj

    async def connect(self, socket_path: str):
        """ Connect to a remote hardware controller on a path

        Use :py:meth:`build` to create the adapter and connect in one step
        """
        assert not self._connection, 'Already connected'
        r, w = await asyncio.open_unix_connection(
            socket_path)
        self._connection = UnixSocketClient._Connection(
            socket_path, r, w)

    def disconnect(self):
        if self._connection:
            self._connection.writer.write_eof()
            self._connection.writer.close()
            del self._connection
        self._connection = None

    async def send_message(
            self, request: str,
            response_expected: bool,
            **kwargs: Any) -> Response:
        """
        Transport the message to the server and return the response.

        :param request: The JSON-RPC request string.
        :param response_expected: Whether the request expects a response.
                                  currently ignored; only json-rpc requests
                                  (not notifications) are supported
        :returns: A response object
        """
        assert self._connection, 'Not connected'
        self._connection.writer.write(request.encode())
        await self._connection.writer.drain()
        response_obj = await self._connection.decoder.read_object()
        return Response(json.dumps(response_obj))

    async def send(self,
                   request: Union[str, Dict, List],
                   *args, **kwargs) -> Response:
        """
        Override of jsonrpcclient.async_client.AsyncClient.send that applies
        type transforms to the passed request.

        Note that the Dict element in the annotation for request applies to
        the :py:class:`jsonrpcclient.request.Request` or
        :py:class:`jsonrpcclient.request.Notification` which inherit from
        `dict`. `List` is in there for the jsonrpcclient/server batch requests
        functionality, which we don't use, and wouldn't be any more efficient
        anyway since this isn't http, so we just complain about it. The args
        and kwargs are just passed up.
        """
        assert not isinstance(request, list),\
            'Batch requests are not supported'
        assert isinstance(request, dict),\
            'How did you manage to already serialize this request'
        method = request['method']
        if method in self._funcmap and request.get('params'):
            new_params = _apply_arg_transforms(
                request['params'],
                self._funcmap[method])
            LOG.debug(
                f"request param xform: {request['params']} -> {new_params}")
            request['params'] = new_params
        elif method not in self._funcmap:
            LOG.warning(
                f"jrpc client: no funcmap entry for {request['method']}")

        response = await super().send(request, *args, **kwargs)
        if isinstance(response.data, SuccessResponse)\
           and method in self._funcmap:
            # We need to transform the return type
            xformed = self._funcmap[method].return_xform(response.data.result)
            LOG.debug(f'response xform: {response.data.result}->{xformed}')
            response.data.result = xformed
        return response


def _build_property_map(klass) -> Dict[str, str]:
    """
    Build a map from property names to property getter names
    """
    return {
        propname: prop.fget.__name__
        for propname, prop in inspect.getmembers(
                klass, lambda p: isinstance(p, property))
    }


def generate_proxies(klass, parent, pred):
    """ Build a bunch of method standins for API methods.

    The result is a mapping of method names to tuples of
    (method obj, signature obj)
    """
    def _value(func):
        meth = MethodType(func, parent)
        sig = inspect.signature(meth)
        return meth, sig

    return {
        name: _value(func)
        for name, func in inspect.getmembers(klass, pred)
    }


class JsonRpcAdapter(HardwareAPILike):
    """ A wrapper to communicate with a remote hardware control server

    This can be used like the other adapters as a standin for a hardware
    control server. Unlike the other adapters, it transmits calls via jsonrpc
    to a hardware controller running in a different process. This can be used
    to run protocols from processes other than the API server, as is required
    for jupyter interop.
    """
    def __init__(self,
                 socket_path: str,
                 loop: asyncio.AbstractEventLoop = None) -> None:
        """ Build the JsonRpcAdapter

        :param socket_path: The path to the jsonrpc socket to use.
        """
        if not loop:
            loop = asyncio.get_event_loop()
        self._loop = loop
        self._socket_path = socket_path
        self._propmap = _build_property_map(API)

        def async_only(p):
            return inspect.iscoroutinefunction(p)

        self._coromap = generate_proxies(API, self, async_only)
        self._client: Optional[UnixSocketClient] = None

    async def connect(self):
        assert not self._client, 'Already connected'
        self._client = await UnixSocketClient.build(self._socket_path)

    def disconnect(self):
        self._api = API.build_hardware_simulator()

    def __getattr__(self, attr_name):
        assert self._client, 'Connect to a socket with connect()'
        if attr_name in self._propmap:
            getter = self._propmap[attr_name]
            LOG.debug(
                f"Retrieving value for property {attr_name} using{getter}")

            async def prop_wrapper():
                resp = await self._client.request(getter)
                return resp.data.result

            return prop_wrapper()
        elif attr_name in self._coromap:
            dummy_meth, dummy_sig = self._coromap[attr_name]

            @functools.wraps(dummy_meth)
            async def _wrapper(*args, **kwargs):
                bound = dummy_sig.bind(*args, **kwargs)
                res = await self._client.request(attr_name,
                                                 **bound.arguments)
                return res.data.result
        else:
            return AttributeError(attr_name)
