import json

from enum import Enum
from typing import Any, Dict, List, Optional, Union, Tuple, Iterable

from .constants import JSONRPC_VERSION, SOCKET_PATH
from .errors import (
    JSONRPCError,
    JSONRPCParseError,
    JSONRPCInvalidRequestError,
)
from .errors.exceptions import JSONRPCInvalidRequestException

_REQUIRED_FIELDS = set(["jsonrpc", "method"])
_POSSIBLE_FIELDS = set([*_REQUIRED_FIELDS, "params", "id"])

Params = Union[List[Any], Dict[str,Any]]


class IPCProcess(Enum):
    """IPCProcesses we can talk to over ipc."""
    HARDWARE = "hardware"
    ROBOT_SERVER = "robot_server"
    SYSTEM_SERVER = "system_server"


SOCKET_PATHNAMES: Dict[IPCProcess, str] = {
    proc: f"{SOCKET_PATH}/{proc.value}.sock"
    for proc in list(IPCProcess)
}

class JSONRPCRequest:

    """ class for JSON-RPC 2.0 requests."""

    def __init__(
        self,
        method: Optional[str] = None,
        params: Optional[Params] = None,
        _id: Optional[int] = None,
        is_notification: Optional[bool] = False,
        **kwargs,
    ) -> None:
        """Constructor"""
        self._method = method
        self._params = params
        self.__id = _id
        self.is_notification = is_notification
        self._version = kwargs.get('jsonrpc', JSONRPC_VERSION)

    def __repr__(self) -> str:
        """String representation of this object."""
        return f"<{self.__class__.__name__}: id={self.__id} method={self._method} params={self._params}>"

    @classmethod
    def from_data(cls, data: Union[List, Dict]) -> "JSONRPCRequest":
        """attemps to create a JSONRPCRequest from a list or single dict."""
        is_batch = isinstance(data, list)
        data = data if is_batch else [data]
        if not all(data):
            raise JSONRPCInvalidRequestException("Data cannot be empty or None")

        # Make sure all the requests are dictionaries
        if not all(isinstance(d, dict) for d in data):
            raise JSONRPCInvalidRequestException(
                "Each request should be a dict"
            )

        # validate the supplied fields
        result: List[JSONRPCRequest] = list()
        for d in data:
            if not _REQUIRED_FIELDS <= set(d.keys()) <= _POSSIBLE_FIELDS:
                extra = set(d.keys()) - _POSSIBLE_FIELDS
                missed = _REQUIRED_FIELDS - set(d.keys())
                msg = f"Invalid request. Extra fields: {extra}, Missed fields: {missed}"
                raise JSONRPCInvalidRequestException(msg)

            # create the request object
            try:
                result.append(cls(
                    method=d["method"], params=d.get("params"),
                    _id=d.get("id"), is_notification="id" not in d,
                    jsonrpc=d.get("jsonrpc"),
                ))
            except ValueError as e:
                raise JSONRPCInvalidRequestException(str(e))

        return JSONRPCBatchRequest(*result) if is_batch else result[0]

    @classmethod
    def from_json(cls, json_str: str) -> "JSONRPCRequest":
        """Create a JSONRPCRequest object from json data."""
        data = json.loads(json_str)
        if not isinstance(data, dict) or not isinstance(data, list):
            raise ValueError("jsonrpc data needs to be a dict or a list.")
        return cls.from_data(data)

    @property
    def method(self) -> str:
        """The method name."""
        return self._method

    @method.setter
    def method(self, value: str) -> None:
        """Setter for the method."""
        if not isinstance(value, str):
            raise ValueError("Method is not a string")

        if value.startswith("rpc."):
            raise ValueError(
                "Method names cannot begin with the word rpc followed by a " +
                "period (.) as this is reserved for rpc-internal methods.")
        self._method = value

    @property
    def params(self) -> Optional[Union[Dict, List]]:
        """req parameters"""
        return self._params

    @params.setter
    def params(self, value: Optional[Union[Dict, List]] = None) -> None:
        """The parameters of this request.

        This can either be a dict or list
        """
        if value is not None and not (
            isinstance(value, list) or isinstance(value, dict)):
            raise ValueError("params must a list or dictionary if not None")
        self._params = value

    @property
    def args(self) -> Tuple[str]:
        """ Method position arguments.

        :return tuple args: method position arguments.

        """
        return tuple(self._params) if isinstance(self._params, list) else tuple()

    @property
    def kwargs(self) -> Dict[str, str]:
        """ Method named arguments.

        :return dict kwargs: method named arguments.

        """
        return self._params if isinstance(self._params, dict) else dict()

    @property
    def _id(self) -> Optional[int]:
        """The index number of this request."""
        return self.__id

    @_id.setter
    def _id(self, value: Union[int, str]) -> None:
        """Setter for changing request id."""
        if not (isinstance(value, int) or isinstance(value, str)):
            raise ValueError("id needs to be an integer or string")
        self.__id = int(value)

    @property
    def version(self) -> str:
        """The version of this json-rpc request."""
        return self._version

    @property
    def dict(self) -> Dict[str, Any]:
        """Dictionary representing this object."""
        data = {
            "jsonrpc": self._version,
            "method": self._method,
        }
        # only include id if not a notification
        if not self.is_notification:
            data["id"] = self.__id

        # only include params if available
        if self.params:
            data["params"] = self.params
        return data

    @property
    def json(self) -> str:
        """Returns a serialized json string of this object."""
        return json.dumps(self.dict)


class JSONRPCResponse:

    """ class for JSON-RPC 2.0 responses."""

    def __init__(self, _id: Optional[int] = None, **kwargs) -> None:
        """Constructor"""
        self.__id = _id
        self._result = kwargs.get('result')
        self._error = kwargs.get('error')
        self._version = kwargs.get('jsonrpc', JSONRPC_VERSION)
        self.request: Optional[JSONRPCRequest] = None

        # we must have either a result or error
        if 'result' not in kwargs and 'error' not in kwargs:
            raise ValueError("Either result or error should be used")

    def __repr__(self) -> str:
        """String representation of this object."""
        return f"<{self.__class__.__name__}: id={self.__id} result={self._result}>"

    @classmethod
    def from_json(cls, json_str: str) -> "JSONRPCResponse":
        """Create a JSONRPCResponse object from json data."""
        data = json.loads(json_str)
        if not isinstance(data, dict):
            raise ValueError("jsonrpc data needs to be a dictionary.")
        resp = cls(**data)
        resp._id = data.get('id')
        return resp

    @property
    def _id(self) -> Union[str, int]:
        """The index number of this request."""
        return self._id

    @_id.setter
    def _id(self, value: Union[str, int]) -> None:
        """Setter for changing request id."""
        if value is not None and type(value) not in [int, str]:
            raise ValueError("id needs to be an integer or string")
        self.__id = value

    @property
    def result(self) -> Any:
        """The result value from executing the jsonrpc request."""
        return self._result

    @result.setter
    def result(self, value: Any):
        """Setter for the result value."""
        if self.error:
            raise ValueError("Can't set result if there is an error")
        self._result = value

    @property
    def error(self) -> JSONRPCError:
        """The error value if something goes wrong when handling a jsonrpc request."""
        return self._error

    @error.setter
    def error(self, value: JSONRPCError):
        """Setter for the error value."""
        if self.result:
            raise ValueError("Can't set error if there is a result")
            self._error = value

    @property
    def dict(self) -> Dict[str, Any]:
        """Get a dict representing the JSONRPCResponse object."""
        data = {
            "jsonrpc": self._version,
            "id": self.__id,
        }

        # send result if there is no error
        if not self._error:
            data["result"] = self._result
        else:
            data["error"] = self._error.dict

            # If there was an error in detecting the `id` key in the Request 
            # object (e.g. Parse error/Invalid Request), it MUST be Null.
            # https://www.jsonrpc.org/specification
            if type(self._error) in [JSONRPCParseError, JSONRPCInvalidRequestError]:
                self.__id = None
        return data

    @property
    def json(self) -> str:
        """Returns a serialized json string of this object."""
        return json.dumps(self.dict)


class JSONRPCBatchRequest(object):
    """Class for a batch jsonrpc request."""

    def __init__(self, *requests) -> None:
        """Constructor."""
        self.requests = requests

    @classmethod
    def from_json(cls, json_str) -> "JSONRPCBatchRequest":
        """Instantiate class given a json string."""
        return JSONRPCRequest.from_json(json_str)

    @property
    def json(self) -> str:
        """Serialized data for this object."""
        return json.dumps([r.dict for r in self.requests])

    def __iter__(self):
        """Iterator to handle multiple requests"""
        return iter(self.requests)


class JSONRPCBatchResponse(object):
    """Class for a batch jsonrpc response."""

    def __init__(self, *responses) -> None:
        """Constructor"""
        self.responses = responses
        self.request: Optional[JSONRPCBatchRequest] = None

    @property
    def data(self) -> List[Any]:
        """The data contained within each response."""
        return [r.dict for r in self.responses]

    @property
    def json(self) -> str:
        """Serialized string of this batch request."""
        return json.dumps(self.data)

    def __iter__(self) -> Iterable[JSONRPCResponse]:
        """Iterable that returns the responses"""
        return iter(self.responses)

