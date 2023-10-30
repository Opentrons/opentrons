"""Errors and exceptions."""

from jsonrpc.exceptions import JSONRPCError

from typing import Optional


class JSONRPCVersionNotSupported(JSONRPCError):
    """ json-rpc version is not supported error. """

    CODE = -32605
    MESSAGE = "Invalid json-rpc version."


class BaseException(Exception):
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
        """String representation of this exception."""
        return f"<{self.__class__.__name__}: method: {self._name} message: {self._message}>"


class InvalidCoroutineFunction(BaseException):
    """Error raised when the function being added to the dispatcher is not async."""
    def __init__(self, method) -> None:
        super().__init__(method, message="Method is not async")


class contextAlreadyRegisteredException(BaseException):
    """Error raised when try to register an already registered context."""
    def __init__(self, method) -> None:
        super().__init__(method, message="Context arg already registered")


