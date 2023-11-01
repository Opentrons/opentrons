"""This module is responsible for executing and formulating an rpc response."""
import asyncio
import json
from typing import Any, Optional, AsyncGenerator, List, Dict

from jsonrpc.jsonrpc2 import JSONRPC20BatchRequest, JSONRPC20BatchResponse
from jsonrpc.utils import is_invalid_params
from jsonrpc.exceptions import (
    JSONRPCInvalidRequest,
    JSONRPCInvalidRequestException,
    JSONRPCParseError,
    JSONRPCDispatchException,
    JSONRPCServerError,
    JSONRPCMethodNotFound,
    JSONRPCInvalidParams,
)

from .constants import JSONRPCRequest, JSONRPCResponse
from .dispatcher import JSONRPCDispatcher
from .errors import JSONRPCVersionNotSupported, contextAlreadyRegisteredException


# we only support json-rpc v2.0
SUPPORTED_JSON_RPC_VERSION = ["2.0"]

class JSONRPCResponseManager:
    """This class is responsible for validating json-rpc messages and executing commands."""
    def __init__(self,
        dispatcher: JSONRPCDispatcher,
        context: Optional[Dict[str, Any]] = None
    ) -> None:
        """Constructor"""
        self._dispatcher = dispatcher
        self._context = context or dict()

    @property
    def context(self) -> Dict[str, Any]:
        """Dictionary of context args to their objects."""
        return self._context

    def add_context(self, context_arg: str, context_obj: Any) -> Any:
        """Register a context arg and context object."""
        if self._context.get(context_arg):
            raise contextAlreadyRegisteredException(context_arg)
        self._context[context_arg] = context_obj
        return context_obj

    def remove_context(self, context_arg: str) -> Optional[Any]:
        """Remove a context arg and object from the dict."""
        if self._context.get(context_arg):
            return self._context.pop(context_arg)
        return None

    async def handle(self, request_str: str) -> Optional[JSONRPCResponse]:
        """Validate that this data is a json-rpc message and execute its method, returning a JSONRPCResponse if applicable."""
        try:
            data = json.loads(request_str)
        except (TypeError, ValueError, json.JSONDecodeError):
            return JSONRPCResponse(error=JSONRPCParseError()._data)

        # Validate the data request
        try:
            request = JSONRPCRequest.from_data(data)
        except JSONRPCInvalidRequestException:
            return JSONRPCResponse(error=JSONRPCInvalidRequest()._data)

        return await self._handle_request(request)

    async def _handle_request(
        self,
        request: JSONRPCRequest,
    ) -> Optional[JSONRPCResponse]:
        """Execute a valid json-rpc request and return a response."""
        rs = request if isinstance(request, JSONRPC20BatchRequest) \
            else [request]

        # lets collect our responses
        responses = [resp async for resp in self._get_responses(rs)]

        # dont respond if this is a notification
        if not responses:
            return None

        if isinstance(request, JSONRPC20BatchRequest):
            response = JSONRPC20BatchResponse(*responses)
            response.request = request
            return response
        else:
            return responses[0]

    async def _get_responses(
        self,
        requests: List[JSONRPCRequest],
    ) -> JSONRPCResponse:
        """ Response for each single JSON-RPC Request."""

        # response helper
        def _make_response(
                request: JSONRPCRequest,
                **kwargs: int
            ) -> Optional[JSONRPCResponse]:
            # make sure we can serialize this response
            response = JSONRPCResponse(_id=request._id, **kwargs)
            assert response.json
            response.request = request

            # only respond if this is not a notify message
            return response if not request.is_notification else None

        for request in requests:
            if request.JSONRPC_VERSION not in SUPPORTED_JSON_RPC_VERSION:
                yield _make_response(request, error=JSONRPCVersionNotSupported()._data)
                return

            # attempt get the method from the dispatcher
            try:
                method = self._dispatcher.methods[request.method]
            except KeyError:
                yield _make_response(request, error=JSONRPCMethodNotFound()._data)
                return

            # get the args and kwargs
            args = request.args
            kwargs = request.kwargs
            if '__args' in kwargs:
                pos_args = kwargs.pop('__args')
                args = tuple(pos_args)

            # add context object if available
            context_arg = self._dispatcher.context.get(method.name)
            context_obj = self._context.get(context_arg)
            if context_arg and context_obj:
                # add context to the args
                args = (context_obj, *args)

           # execute the command and get the response
            try:
                function = method.method
                if asyncio.iscoroutinefunction(function):
                    result = await function(*args, **kwargs)
                else:
                    result = function(*args, **kwargs)
                yield _make_response(request, result=result)
            except JSONRPCDispatchException as e:
                yield _make_response(request, error=e.error._data)
            except Exception as e:
                data = {
                    "type": e.__class__.__name__,
                    "args": e.args,
                    "message": str(e),
                }

                if isinstance(e, TypeError) and is_invalid_params(
                        method, *request.args, **request.kwargs):
                    yield _make_response(
                        request,
                        error=JSONRPCInvalidParams(data=data)._data)
                else:
                    yield _make_response(
                        request,
                        error=JSONRPCServerError(data=data)._data)
