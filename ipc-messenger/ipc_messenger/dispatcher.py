from typing import Callable, Any

from jsonrpc.dispatcher import Dispatcher  #type: ignore[import]

class JSONRPCDispatcher(Dispatcher):  #type: ignore
    def __init__(self, *args: str, **kwargs: int ) -> None:
        """Constructor"""
        super().__init__(*args, **kwargs)

    def is_valid(method: Callable[[Any], Any]) -> bool:
        """Returns true if this method can be added."""
        return True

ipc_dispatcher: JSONRPCDispatcher = JSONRPCDispatcher()
