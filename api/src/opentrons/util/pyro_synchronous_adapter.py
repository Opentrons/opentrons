"""Synchronous class wrapper and functions for creating Pyro compatible objects."""
import asyncio
import functools
import inspect
import Pyro5.api as pyro
from typing import Type, Callable, Optional, Any
from types import FunctionType, MethodType

def synchronous(func: Callable) -> Callable:
    """Decorator that makes an async function callable synchronously."""
    if not asyncio.iscoroutinefunction(func):
        return func  # no-op for non-async functions

    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        #todo(chb, 2026-02-17): This is true of the OT3API, is it true elsewhere?
        self = args[0] # Expect the instance to contain a loop
        loop: Optional[asyncio.AbstractEventLoop] = getattr(self, "_loop", None)
        coro = func(*args, **kwargs)

        if loop is None:
            raise RuntimeError("Expected event loop not provided by instance.")

        try:
            running_loop = asyncio.get_running_loop()
        except RuntimeError:
            # There is no running loop
            running_loop = None

        # If the loop is running and is not the current running loop, we can execute synchronously
        if loop.is_running():
            if running_loop is loop:
                # We're in the same thread and the loop is running, cannot block synchronously.
                raise RuntimeError("Cannot call synchronous wrapped instance from the same event loop." )
            
            # Execute the coroutine
            future = asyncio.run_coroutine_threadsafe(coro, loop)
            return future.result()
        
        else:
            raise RuntimeError("Instance event loop is not running.")

    return wrapper

    
def sync_wrapper_class(cls: Type) -> Type:
    """Class decorator that creates synchronous instances of all async methods of an interal class inside a wrapper class.
    Exposes members of the original object and binds them to that instance when called via attributes of the decorated class.
    """
    original_init = cls.__init__
    @functools.wraps(original_init)
    def process_core_obj (self, *args, **kwargs):
        core_obj = args[0]
        for name, attr in inspect.getmembers(core_obj.__class__):
            if "__" not in name:
                if isinstance(attr, FunctionType) and asyncio.iscoroutinefunction(attr) and not name.startswith("_"):
                    # Wrap coroutines in a synchronous function call, bound it to the original instance and expose the wrapped method
                    exposed = pyro.expose(synchronous(attr))
                    bound_method = MethodType(exposed, core_obj)
                    setattr(cls, name, bound_method)
                elif isinstance(attr, FunctionType) and not name.startswith("_"):
                    # Expose standard functions and bound the exposed function to the original instance
                    exposed = pyro.expose(attr)
                    bound_method = MethodType(exposed, core_obj)
                    setattr(cls, name, bound_method)
                elif isinstance(attr, property) and not name.startswith("_"):
                    # Bound property to the original instance and expose the bounded property
                    def bound(func):
                        if func is None:
                            return None
                        return lambda self, *a, **kw: func(core_obj, *a, **kw)
                    
                    bound_property = property(
                        fget=bound(attr.fget),
                        fset=bound(attr.fset),
                        fdel=bound(attr.fdel),
                        doc=attr.__doc__,
                    )
                    exposed = pyro.expose(bound_property)
                    setattr(cls, name, exposed)
                else:
                    setattr(cls, name, attr)
        original_init(self, *args, **kwargs)
        
    cls.__init__ = process_core_obj
    return cls

@sync_wrapper_class
class PyroSynchronousObject:
    """A Pyro-ready wrapped class. It takes the base object (such as an OT3API) and makes it synchronous and exposed via pyro.
    Bound methods of that base object execute in the original instance, with the generated class attributes here acting as an alias referencing them.
    """

    def __init__(
        self,
        core_obj: Type
    ):
        self._core_obj = core_obj
