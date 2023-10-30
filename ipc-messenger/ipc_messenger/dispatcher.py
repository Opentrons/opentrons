from typing import Callable, Any
from asyncio import iscoroutine

from jsonrpc.dispatcher import Dispatcher  #type: ignore[import]

from .errors import InvalidCoroutineFunction

class JSONRPCDispatcher(Dispatcher):  #type: ignore
    def __init__(self, *args: str, context=None, **kwargs: int) -> None:
        """Constructor"""
        self._context = context
        super(JSONRPCDispatcher, self).__init__(*args, **kwargs)

    def add_method(self, *args, **kwargs) -> None:
        # reject non-async methods
        #if not iscoroutine(f):
        #    raise InvalidCoroutineFunction(f.__name__)
        super(JSONRPCDispatcher, self).add_method(*args, **kwargs)

ipc_dispatcher: JSONRPCDispatcher = Dispatcher()
