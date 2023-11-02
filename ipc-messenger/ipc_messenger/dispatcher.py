from functools import partial
from typing import Callable, Any, Optional, Dict


class Method(object):
    """Object representing an rpc method."""

    def __init__(self, method, *args, context = None, **kwargs) -> None:
        """Constructor"""
        self.method = method
        self.context = context
        self.name = method.__name__

    def __repr__(self) -> str:
        """String representation of a methof object."""
        return f"<{self.__class__.__name__}: method={self.name}>"


class JSONRPCDispatcher():
    """This class is responsible for keeping track of rpc methods and context objects."""

    def __init__(
        self,
        *args: str,
        context: Optional[Dict[str, Any]] = None,
        **kwargs: int
    ) -> None:
        """Constructor"""
        self._context: Dict[str, Any] = dict()
        self._methods: Dict[str, Method] = dict()

    @property
    def context(self) -> Dict[str, Any]:
        """Registered context args and their objects"""
        return self._context

    @property
    def methods(self) -> Dict[str, Callable]:
        """Registered method names and their functions."""
        return self._methods

    def add_method(
        self,
        method: Callable = None,
        name = None,
        context = None
    ) -> Method:
        """Add this method to the dict of registered methods."""
        if (name or context) and not method:
            return partial(self.add_method, name=name, context=context)
        name = name or method.__name__
        method_obj = Method(method, context=context)
        self._methods[name] = method_obj
        if context:
            self._context[name] = context
        return method_obj

