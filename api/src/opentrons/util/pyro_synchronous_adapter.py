"""Synchronous class wrapper and functions for creating Pyro compatible objects."""

import asyncio
import functools
import inspect
from types import FunctionType, MethodType
from typing import Any, Callable, Dict, Iterator, Optional, ParamSpec, TypeVar

from pydantic import BaseModel
from Pyro5 import api as pyro

T = TypeVar("T")
P = ParamSpec("P")


class _PSO:
    pass


class DaemonUtility:
    """Class to represent the Pyro Daemon Utility used by Opentrons Entry Processes.

    This class manages the lifecycle of PyroSynchronousObjects that are generated for a resource
    and served on a Pyro Daemon.
    """

    def __init__(
        self,
        daemon: pyro.Daemon,
    ) -> None:
        self._PyroSynchronousObjects: Dict[pyro.URI, _PSO] = {}
        self._daemon = daemon

    def add_PSO(self, new_pso: Any) -> None:
        """Add a new PyroSynchronousObject to the list of objects managed by this Daemon Utility."""
        uri = self._daemon.register(new_pso)  # type: ignore
        self._PyroSynchronousObjects[uri] = new_pso

    def remove_PSO(self, pso: Any) -> None:
        """Remove specified PyroSynchronousObject from the list of objects managed by this Daemon Utility."""
        uri = self._daemon.uriFor(pso)  # type: ignore
        if uri in self._PyroSynchronousObjects:
            self._daemon.unregister(self._PyroSynchronousObjects[uri])  # type: ignore
            del self._PyroSynchronousObjects[uri]

    def find_PSO(self, core_obj: Any) -> _PSO | None:
        """Find a managed PyroSynchronousObject based on the core object it aliases."""
        for uri in self._PyroSynchronousObjects.keys():
            if self._PyroSynchronousObjects[uri]._core_obj is core_obj:  # type: ignore
                return self._PyroSynchronousObjects[uri]
        return None

    def proxy_for(self, pso: Any) -> pyro.Proxy:
        """Return a Pyro5 Proxy for an already-registered PyroSynchronousObject."""
        # todo(chb, 2026-03-11): Add proper error handling here - what kind of raise case do we want this to result in?
        # This could trigger inside a wrapper pyro_behavior function on a PSO call for example.
        return self._daemon.proxyFor(pso)  # type: ignore


class _PyroSpecialBehavior(BaseModel):
    specialty_function: Callable[[DaemonUtility, Any, str, Any], Any]
    apply_local: bool


def pyro_behavior(
    specialty_func: Callable[P, T], apply_local: bool
) -> Callable[[Any], Any]:
    """Decorator to indicate to the PyroSynchronousObject adapter that a function must be bound with a special method.

    This works by adding the `specialty_func` to the original function as metadata, to be used by the PyroSynchronousObject
    constructor when building the alias attributes.

    Params:
        specialty_func: The wrapper method that will be used when binding a decorated attribute of an object instance.
        apply_local: Boolean to determine if this specialty function should wrap the attribute on the PyroSynchronousObject or
                     on the original object instance. Setting to True applies the specialty function to the original instance.
    """

    def decorator(func: Callable[[Any], Any]) -> Callable[[Any], Any]:
        func._pyro_specialty_behavior = _PyroSpecialBehavior(  # type: ignore
            specialty_function=specialty_func,  # type: ignore
            apply_local=apply_local,
        )
        return func

    return decorator


def synchronous(func: Callable[P, T]) -> Callable[P, T]:
    """Decorator that makes an async function callable synchronously."""
    if not inspect.iscoroutinefunction(func):
        return func  # no-op for non-async functions

    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:
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


def PyroSynchronousObject(core_obj: Any, utility: DaemonUtility) -> _PSO:
    """A Pyro-ready class generator.

    It takes the base object (such as an OT3API); makes an object wrapper with a
    synchronous version of the base object's methods; and exposes the wrapper via pyro. Pyro requests to the wrapper
    synchronous methods are forwarded to the original bound async methods of that base object in the original event
    loop and thread, with the generated class attributes here acting as an alias referencing them.

    When a PyroSynchronousObject is created the result is a per-instance constructed class, unique per instantiation.
    This is done so that multiple instances of a PyroSynchronousObject can be created within a single process, without
    the attributes reflecting on this base class itself. This constructed sub-class will contain alias bound-methods
    based on the original core object (as described above). Each of these bound methods/properties are guaranteed
    to be synchronous and execute on the original core object instance.

    In simplest terms, the result of this class generator is a wrapper object containing attributes with the same names
    as the `core_obj` that is passed in. When the wrapper's attributes are called, they will forward the call to the
    original `core_obj` and it will then execute them. Asynchronous functions will block until finished.

    Class wrapping Example
    -------
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


    For developer implementation with Pyro, this class generator was built to be relatively turnkey. A base object, such as an
    instance of an OT3API, may be provided. The resulting object instance is ready to serve via pyro, and will provide
    blocking callables to any client which is served.

    NOTE: The wrapper should only be called via pyro, never directly.

    Server-side Example
    -------
    .. code-block::
    >>> from Pyro5 import api as pyro
    >>> # ... This example assumes an instance of OT3API ...
    >>> pyro_ot3api = PyroSynchronousObject(ot3api)
    >>> # Serve to clients
    >>> pyro.serve({"OT3API" : pyro_ot3api})

    Client-side Example
    -------
    .. code-block::
    >>> ot3_proxy_uri = pyro.resolve("PYRONAME:OT3API")
    >>> ot3_proxy = pyro.Proxy(ot3_proxy_uri)
    >>> # Attributes with a pyro_behavior that forwards proxies will return usable ones immediately
    >>> thermocycler_proxy = ot3_proxy.attached_modules[0]
    >>> # The proxy object can now call the original instance running on the server-process
    >>> ot3_proxy.home()
    >>> thermocycler_proxy.open_lid()
    """
    SyncCls = type(
        f"PyroSynchronousObject_{core_obj.__class__.__name__}_{id(core_obj)}",
        (_PSO,),
        dict(_build_classdict(core_obj, utility)),
    )
    return SyncCls()  # type: ignore


def _build_classdict(  # noqa: C901
    core_obj: Any, utility: DaemonUtility
) -> Iterator[tuple[str, Any]]:
    async_methods: list[str] = []
    for name, attr in inspect.getmembers(core_obj.__class__):
        if "__" not in name and not name.startswith("_"):
            specialty_behavior = _get_specialty_behavior(attr, name)
            # Handle Core Object modifications
            if (
                specialty_behavior is not None
                and specialty_behavior.apply_local is True
            ):
                # If the `core_obj` contains a weakref then use the inner instance, like a Module inside a CallerBridge
                try:
                    # Grab the inner instance of the core object to modify
                    local_obj = core_obj.__weakref__()
                except TypeError:
                    # Otherwise, just use the object passed in as-is
                    local_obj = core_obj
                wrapped_attr = specialty_behavior.specialty_function(
                    utility, local_obj, name, attr
                )
                bound_method = MethodType(wrapped_attr, local_obj)
                setattr(local_obj, name, bound_method)

            # Handle PyroSynchronousObject attribute construction
            if (
                specialty_behavior is not None
                and specialty_behavior.apply_local is False
            ):
                # Apply the specialty function to the attribute on this PSO instance and expose the wrapped specialty method
                exposed = pyro.expose(
                    specialty_behavior.specialty_function(utility, core_obj, name, attr)
                )
                yield (name, exposed)
            elif isinstance(attr, FunctionType) and inspect.iscoroutinefunction(attr):
                # Wrap coroutines in a synchronous function call, bound it to the original instance and expose the wrapped method
                exposed = pyro.expose(synchronous(attr))
                # Track the known async functions so they may be provided as metadata to a client wrapper
                async_methods.append(name)
                bound_method = MethodType(exposed, core_obj)
                yield (name, bound_method)
            elif isinstance(attr, FunctionType):
                # Expose standard functions and bound the exposed function to the original instance
                exposed = pyro.expose(attr)
                bound_method = MethodType(exposed, core_obj)
                yield (name, bound_method)
            elif isinstance(attr, property):
                # Bound property to the original instance and expose the bounded property
                # Accepts the functional arguments (Callables) of a property to rebind
                def _bound(
                    func: Callable[[Any], Any]
                    | Callable[[Any, Any], None]
                    | Callable[[Any], None]
                    | None,
                ) -> Any | None:
                    if func is None:
                        return None
                    return lambda self, *a, **kw: func(core_obj, *a, **kw)

                bound_property = property(
                    fget=_bound(attr.fget),
                    fset=_bound(attr.fset),
                    fdel=_bound(attr.fdel),
                    doc=attr.__doc__,
                )
                exposed = pyro.expose(bound_property)  # type: ignore
                yield (name, exposed)

    # Attach the known async methods list to the PSO as a private member and expose a getter method
    yield ("_pyro_async_methods", async_methods)
    yield ("get_pyro_async_methods", pyro.expose(property(get_pyro_async_methods)))  # type: ignore

    # Attach the `core_obj` instance as a private member for internal tracking
    try:
        # If the `core_obj` contains a weakref then for tracking we yield the inner instance
        yield ("_core_obj", core_obj.__weakref__())
    except TypeError:
        yield ("_core_obj", core_obj)


### Helpers ###


def _get_specialty_behavior(func: Any, name: str) -> _PyroSpecialBehavior | None:
    if inspect.iscoroutinefunction(func) or isinstance(func, FunctionType):
        if hasattr(func, "_pyro_specialty_behavior"):
            return func._pyro_specialty_behavior  # type: ignore
    elif isinstance(func, property):
        if hasattr(func.fget, "_pyro_specialty_behavior"):
            return func.fget._pyro_specialty_behavior  # type: ignore
    return None


def get_pyro_async_methods(self) -> list[str]:  # type: ignore
    result: list[str] = self._pyro_async_methods
    return result


### Specialty Functions for use with the `pyro_behavior` decorator ###

## Alias Specialty Functions - Used to wrap attributes on the PyroSynchronousObject instance


def convert_result_to_proxy(  # noqa: C901
    utility: DaemonUtility, core_obj: Any, name: str, attr: Callable[P, T]
) -> Callable[P, T]:
    """Wrapper to change the output of a function to a PyroSynchronousObject or list of PyroSynchronousObjects.

    This function is intended for use with `pyro_behavior` and is executed when called through a Pyro Proxy.
    The result(s) will be newly instanced Proxy object(s) on the Daemon. This is particularly useful for instances
    that contain other instances, such as an OT3API with internal module instances like Thermocycler.
    """

    @functools.wraps(attr)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:
        if inspect.iscoroutinefunction(attr):
            sync_func = synchronous(attr)
            bound_method = MethodType(sync_func, core_obj)
            result = asyncio.run(bound_method(*args, **kwargs))
        elif isinstance(attr, FunctionType):
            bound_method = MethodType(attr, core_obj)
            result = asyncio.run(bound_method(*args, **kwargs))
        elif isinstance(attr, property):
            result = getattr(core_obj, name)
        else:
            raise ValueError(
                "Provided base attribute must be a Property, a Method or an Async method."
            )
        # Convert the instance result to PSO(s) and return the Proxy objects
        try:
            proxy_list = []
            for r in result:
                pyro_synchronous_obj = utility.find_PSO(r)
                if pyro_synchronous_obj is None:
                    pyro_synchronous_obj = PyroSynchronousObject(r, utility)
                    utility.add_PSO(pyro_synchronous_obj)
                proxy_list.append(utility.proxy_for(pyro_synchronous_obj))
            return proxy_list
        except TypeError:
            pyro_synchronous_obj = utility.find_PSO(result)
            if pyro_synchronous_obj is None:
                pyro_synchronous_obj = PyroSynchronousObject(result, utility)
                utility.add_PSO(pyro_synchronous_obj)
            return utility.proxy_for(pyro_synchronous_obj)

    if isinstance(attr, property):
        # If the original attribute was a property, ensure the wrapped attribute is
        return property(wrapper)
    return wrapper


## Local Specialty Functions - Used to wrap attributes on the original instance


def remove_pyro_synchronous_object(
    utility: DaemonUtility, core_obj: Any, name: str, attr: Callable[P, T]
) -> Any:
    """Wrapper to remove a PyroSynchronousObject from it's DaemonUtility, and unregister its Proxy object.

    This function is intended for use with `pyro_behavior` and is executed when the local attribute of the original
    core_obj instance is called. The original core_obj attribute is wrapped and will still execute, but the attached
    logic will handle cleanup of the PyroSynchronousObject related to that core_obj instance.
    """

    @functools.wraps(attr)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:
        active_pso = utility.find_PSO(core_obj=core_obj)
        # Remove a PSO, if found, and unregister it from the daemon
        if active_pso is not None:
            utility.remove_PSO(active_pso)
        return attr(*args, **kwargs)

    @functools.wraps(attr)
    async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:
        active_pso = utility.find_PSO(core_obj=core_obj)
        # Remove a PSO, if found, and unregister it from the daemon
        if active_pso is not None:
            utility.remove_PSO(active_pso)
        return await attr(*args, **kwargs)  # type: ignore

    if inspect.iscoroutinefunction(attr):
        return async_wrapper
    elif isinstance(attr, FunctionType):
        return wrapper
    else:
        raise ValueError("Wrapped base attribute must be a Method, not a Property.")
