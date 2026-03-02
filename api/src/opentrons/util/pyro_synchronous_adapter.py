"""Synchronous class wrapper and functions for creating Pyro compatible objects."""

import asyncio
import functools
import inspect
from types import FunctionType, MethodType
from typing import Any, Callable, Optional, ParamSpec, TypeVar

import Pyro5.api as pyro

T = TypeVar("T")
P = ParamSpec("P")


def synchronous(func: Callable[P, T]) -> Callable[P, T]:
    """Decorator that makes an async function callable synchronously."""
    if not asyncio.iscoroutinefunction(func):
        return func  # no-op for non-async functions

    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:
        # todo(chb, 2026-02-17): This is true of the OT3API, is it true elsewhere?
        self = args[0]  # Expect the instance to contain a loop
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
                raise RuntimeError(
                    "Cannot call synchronous wrapped instance from the same event loop."
                )

            # Execute the coroutine
            future = asyncio.run_coroutine_threadsafe(coro, loop)
            return future.result()

        else:
            raise RuntimeError("Instance event loop is not running.")

    return wrapper


class PyroSynchronousObject:
    """A Pyro-ready class. It takes the base object (such as an OT3API) and makes it synchronous and exposed via pyro.
    Bound methods of that base object execute in the original instance of a native process, with the generated class
    attributes here acting as an alias referencing them.

    When a PyroSynchronousObject is created the result is a per-instance constructed class, unique per instantiation.
    This is done so that multiple instances of a PyroSynchronousObject can be created within a single process, without
    the attributes reflecting on this base class itself. This constructed sub-class will contain alias bound-methods
    based on the original core object (as described above). Each of these bound methods/properties are guaranteed
    to be synchronous and execute on the original core object instance.

    Class wrapping Example:
    Lets say we have a class called `OT3Basic` that looks something like the following -

    .. code-block::
    class OT3Basic:
        _backend: OT3Backend
        @property
        def door_state(self) -> DoorState:
            return self._door_state
        async def home(self) -> None:
            await self._backend.home_motors()

    If we make a PyroSynchronousObject out of it like so -
    .. code-block::
    >>> ot3_instance = OT3Basic()
    >>> pyro_object = PyroSynchronousObject(ot3_instance)

    Then the run time instance of `pyro_object` will actually be a class object that looks like this -
    .. code-block::
    class PyroSynchronousObject_OT3Basic_1234:
        _core_object: Type
        @pyro.expose
        @property
        def door_state(self, *args, **kwargs) -> DoorState:
            return self._core_object.door_state(*args, **kwargs)
        @pyro.expose
        def home(self, *args, **kwargs) -> None:
            return asyncio.run_coroutine_threadsafe(self._core_object.home(*args, **kwargs), self._core_object._loop))


    For developer implementation with Pyro, this class was built to be relatively turnkey. A base object, such as an
    instance of an OT3API, may be provided. The resulting object instance is ready to serve via pyro, and will provide
    blocking callables to any client which is served.

    Server-side Example
    -------
    .. code-block::
    >>> import Pyro5.api as pyro
    >>> # ... This example assumes instances of OT3API and Thermocycler ...
    >>> pyro_ot3api = PyroSynchronousObject(ot3api)
    >>> pyro_thermocycler = PyroSynchronousObject(thermocycler_attached_module)
    >>> # Direct synchronous behavior is supported in-process
    >>> pyro_ot3api.home()
    >>> pyro_thermocycler.open()
    >>> # Serve to clients
    >>> pyro.serve({"OT3API" : pyro_ot3api})
    >>> pyro.serve({"THERMOCYCLER" : pyro_thermocycler})

    Client-side Example
    -------
    .. code-block::
    >>> ot3_proxy_uri = pyro.resolve("PYRONAME:OT3API")
    >>> ot3_proxy = pyro.Proxy(ot3_proxy_uri)
    >>> # The proxy object can now call the original instance running on the server-process
    >>> ot3_proxy.home()
    """

    def __init__(self, core_obj: Any):
        self._core_obj = core_obj

        # Create a per-instance subclass of the current class
        # This is done to ensure that if a process creates multiple instances of a PyroSynchronousObject that
        # each individual instance only contains the attributes of the `core_obj` it was provided, and not others.
        # This also ensures that all attributes of the specific instance of a PyroSynchronousObject are exposed
        # through Pyro, which operates on class-based exposure.
        SyncCls = type(
            f"PyroSynchronousObject_{core_obj.__class__.__name__}_{id(core_obj)}",
            (self.__class__,),
            {},
        )

        for name, attr in inspect.getmembers(core_obj.__class__):
            if "__" not in name:
                if (
                    isinstance(attr, FunctionType)
                    and asyncio.iscoroutinefunction(attr)
                    and not name.startswith("_")
                ):
                    # Wrap coroutines in a synchronous function call, bound it to the original instance and expose the wrapped method
                    exposed = pyro.expose(synchronous(attr))
                    bound_method = MethodType(exposed, self._core_obj)
                    setattr(SyncCls, name, bound_method)
                elif isinstance(attr, FunctionType) and not name.startswith("_"):
                    # Expose standard functions and bound the exposed function to the original instance
                    exposed = pyro.expose(attr)
                    bound_method = MethodType(exposed, self._core_obj)
                    setattr(SyncCls, name, bound_method)
                elif isinstance(attr, property) and not name.startswith("_"):
                    # Bound property to the original instance and expose the bounded property
                    def bound(func):  # type: ignore
                        if func is None:
                            return None
                        return lambda self, *a, **kw: func(self._core_obj, *a, **kw)

                    bound_property = property(
                        fget=bound(attr.fget),  # type: ignore
                        fset=bound(attr.fset),  # type: ignore
                        fdel=bound(attr.fdel),  # type: ignore
                        doc=attr.__doc__,
                    )
                    exposed = pyro.expose(bound_property)
                    setattr(SyncCls, name, exposed)

        # Ensure the individual instance of the PyroSynchronousObject returned is the constructed SyncCls
        # containing all exposed attributes.
        self.__class__ = SyncCls
