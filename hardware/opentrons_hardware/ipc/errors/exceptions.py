from typing import Optional


class JSONRPCException(Exception):
    """Base json-rpc exception object."""
    def __init__(
        self,
        method_name: str,
        message: Optional[str] = None
    ) -> None:
        """Constructor."""
        self._name = str
        self._message = message or ''

    def __repr__(self) -> str:
        """Internal string representation of this exception."""
        return f"<{self.__class__.__name__}: method: {self._name} message: {self._message}>"


class JSONRPCInvalidRequestException(JSONRPCException):
    pass


class JSONRPCDispatchException(JSONRPCException):
    pass
