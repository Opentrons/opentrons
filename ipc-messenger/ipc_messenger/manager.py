"""This module is responsible for executing and formulating an rpc response."""

import json
from asyncio import wait_for
from typing import Any, Union, Optional, Iterator

from jsonrpc.jsonrpc import JSONRPCRequest
from jsonrpc.jsonrpc1 import JSONRPC10Response
from jsonrpc.jsonrpc2 import JSONRPC20Request, JSONRPC20BatchRequest, JSONRPC20Response
from jsonrpc.dispatcher import Dispatcher
from jsonrpc.utils import is_invalid_params
from jsonrpc.exceptions import (
    JSONRPCError,
    JSONRPCInvalidRequest,
    JSONRPCInvalidRequestException,
    JSONRPCParseError,
    JSONRPCDispatchException,
    JSONRPCServerError,
    JSONRPCMethodNotFound,
)

class JSONRPCVersionNotSupported(JSONRPCError):
    """ json-rpc version is not supported error. """

    CODE = -32605
    MESSAGE = "Invalid json-rpc version."


# we only support json-rpc v2.0
SUPPORTED_JSON_RPC_VERSION = ["2.0"]

class JSONRPCResponseManager:
    def __init__(self, dispatcher: Dispatcher) -> None:
        self._dispatcher = dispatcher

    async def handle(self, request_str: str, context: Optional[Any] = None) -> JSONRPC20Response:
        try:
            data = json.loads(request_str)
        except (TypeError, ValueError, json.JSONDecodeError):
            return JSONRPC20Response(error=JSONRPCParseError()._data)

        # for testing
        print("Handle")
        print(data)
        #del data['jsonrpc']
        print(data)
        try:
            request = JSONRPCRequest.from_data(data)
        except JSONRPCInvalidRequestException:
            return JSONRPC20Response(error=JSONRPCInvalidRequest()._data)

        print(request)
        return await self._handle_request(request, context)

    async def _handle_request(
        self,
        request: JSONRPCRequest,
        context: Optional[Any] = None
    ) -> JSONRPC20Response:
        """Execute a valid json-rpc request and return a response."""
        rs = request if isinstance(request, JSONRPC20BatchRequest) \
            else [request]

        # lets collect our responses
        responses = [resp async for resp in self._get_responses(rs, context)]
        print(responses)

        # dont respond if this is a notification
        if not responses:
            return

        if isinstance(request, JSONRPC20BatchRequest):
            response = JSONRPC20BatchResponse(*responses)
            response.request = request
            return response
        else:
            return responses[0]

    async def _get_responses(self, requests, context=None
    ) -> Iterator[JSONRPC20Response]:
        """ Response to each single JSON-RPC Request."""

        def _make_response(**kwargs):
            response = JSONRPC20Response(_id=request._id, **kwargs)
            response.request = request
            # only respond if this is not a notify message
            return response if not request.is_notification else None

        for request in requests:
            output = None
            if request.JSONRPC_VERSION not in SUPPORTED_JSON_RPC_VERSION:
                yield _make_response(error=JSONRPCVersionNotSupported()._data)

            # attempt get the method from the dispatcher
            try:
                method = self._dispatcher[request.method]
            except KeyError:
                yield _make_response(error=JSONRPCMethodNotFound()._data)

            # get the kwargs if available
            kwargs = request.kwargs
            if context is not None:
                context_arg = self._dispatcher.context_arg_for_method.get(
                    request.method)
                if context_arg:
                    context["request"] = request
                    kwargs[context_arg] = context

            # execute the command and get the response
            try:
                result = await wait_for(method(*request.args, **kwargs), timeout=None)
                yield _make_response(result=result)
            except JSONRPCDispatchException as e:
                yield _make_response(error=e.error._data)
            except Exception as e:
                data = {
                    "type": e.__class__.__name__,
                    "args": e.args,
                    "message": str(e),
                }

                print("API Exception: {0}".format(data))

                if isinstance(e, TypeError) and is_invalid_params(
                        method, *request.args, **request.kwargs):
                    yield _make_response(
                        error=JSONRPCInvalidParams(data=data)._data)
                else:
                    yield _make_response(
                        error=JSONRPCServerError(data=data)._data)
