"""JSONRPC Error codes."""

from typing import Optional, Any, Dict

from .codes import ErrorCodes


class JSONRPCError(object):
    """
    When a rpc call encounters an error, the Response Object MUST contain 
    the error member with a value that is a Object with the following members:

    code
        A Number that indicates the error type that occurred.
        This MUST be an integer.

    message
        A String providing a short description of the error.
        The message SHOULD be limited to a concise single sentence.

    data
        A Primitive or Structured value that contains additional
        information about the error. This may be omitted.
        The value of this member is defined by the Server (e.g. detailed
        error information, nested errors etc.).

    The error codes from and including -32768 to -32000 are reserved for 
    pre-defined errors. Any code within this range, but not defined explicitly
    below is reserved for future use. The error codes are nearly the same as
    those suggested for XML-RPC at the following url: 
    http://xmlrpc-epi.sourceforge.net/specs/rfc.fault_codes.php
    """

    def __init__(
        self,
        code: int,
        message: str,
        data: Optional[Any] = None
    ) -> None:
        """Constructor."""
        self._code = code
        self._message = message
        self._data = data

    @property
    def code(self) -> int:
        return self._code

    @code.setter
    def code(self, value: int) -> None:
        """The error code."""
        if not isinstance(value, ErrorCodes):
            raise ValueError("Error code needs to be an ErrorCodes Enum.")
        self._code = value

    @property
    def message(self) -> str:
        return self._message

    @message.setter
    def message(self, value: str) -> None:
        """The message for this error code."""
        if not isinstance(value, str):
            raise ValueError("The error message needs to be a string.")
        self._message = value

    @property
    def data(self) -> Any:
        return self._data

    @data.setter
    def data(self, value: Any) -> None:
        """Additional data for this error message."""
        self._data = value

    @classmethod
    def from_json(cls, data_str: str) -> "JSONRPCError":
        """Get a JSONRPCError instance from a json string."""
        data = json.loads(data_str)
        return cls(
            code=data["code"],
            message=data["message"],
            data=data.get("data"),
        )

    @property
    def dict(self) -> Dict[str, Any]:
        return {
            "code": self._code.value,
            "message": self._message,
            "data": self.data,
        }

    def json(self) -> str:
        """Serialized object"""
        return json.dumps(self.dict)


class JSONRPCParseError(JSONRPCError):
    """Parse Error.

    Invalid JSON was received by the server.
    An error occurred on the server while parsing the JSON text.
    """

    def __init__(self, data: Optional[Any] = None) -> None:
        super().__init__(ErrorCodes.JSON_PARSE_ERROR, "Parse Error", data=data)


class JSONRPCInvalidRequestError(JSONRPCError):
    """Invalid request.

    The JSON sent is not a valid Request object.
    """

    def __init__(self, data: Optional[Any] = None) -> None:
        super().__init__(ErrorCodes.INVALID_REQUEST_ERROR, "Invalid Request", data=data)


class JSONRPCMethodNotFoundError(JSONRPCError):
    """Method not found.

    The method does not exist / is not available.
    """

    def __init__(self, data: Optional[Any] = None) -> None:
        super().__init__(ErrorCodes.METHOD_NOT_FOUND_ERROR, "Method not found", data=data)


class JSONRPCInvalidParamsError(JSONRPCError):
    """Invalid params.

    Invalid method parameter(s).
    """

    def __init__(self, data: Optional[Any] = None) -> None:
        super().__init__(ErrorCodes.INVALID_PARAMS_ERROR, "Invalid params", data=data)


class JSONRPCInternalError(JSONRPCError):
    """Internal json-rpc spec error.

    Internal JSON-RPC error.
    """

    def __init__(self, data: Optional[Any] = None) -> None:
        super().__init__(ErrorCodes.INTERNAL_ERROR, "Internal JSON-RPC error.", data=data)


class JSONRPCServerError(JSONRPCError):
    """Server Error.

    Reserved for implementation-defined server-errors.
    """

    def __init__(self, data: Optional[Any] = None) -> None:
        super().__init__(ErrorCodes.SERVER_ERROR, "Server error.", data=data)


class JSONRPCVersionNotSupportedError(JSONRPCServerError):
    """ json-rpc version is not supported error. """

    def __init__(self, data: Optional[Any] = None) -> None:
        super().__init__(ErrorCodes.JSONRPC_VERSION_ERROR, "Invalid json-rpc version.", data=data)

