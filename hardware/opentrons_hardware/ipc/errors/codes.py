"""Error Codes"""

from enum import Enum

class ErrorCodes(Enum):
    JSON_PARSE_ERROR = -32700
    INVALID_REQUEST_ERROR = -32600
    METHOD_NOT_FOUND_ERROR = -32601
    INVALID_PARAMS_ERROR = -32602
    INTERNAL_ERROR = -32603
    SERVER_ERROR = -32000
    JSONRPC_VERSION_ERROR = -32001
    UNKNOWN_ERROR = -32099

    @classmethod
    def from_int(cls, value: int) -> "ErrorCodes":
        """Return corresponding ErrorCodes for given int"""
        try:
            return cls(value)
        except ValueError:
            return cls.UNKNOWN_ERROR

