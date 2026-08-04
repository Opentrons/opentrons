"""Synchronous class wrapper and functions for creating Pyro compatible objects."""

import asyncio
import enum
import functools
import inspect
import logging
from types import FunctionType, MethodType
from typing import Any, Callable, Dict, Iterator, Optional, ParamSpec, TypeVar

from pydantic import BaseModel
from Pyro5 import api as pyro

from opentrons.util.pyro.pyro_client_async_adapter import (
    AsyncClientPyroFunctionWrapper,
    AsyncClientPyroObject,
    ClientPyroFunctionWrapper,
)
from opentrons.util.pyro.pyro_serialization import (
    PYRO_PROXY,
    NonBuiltinKeyDictWrapper,
    TypedDictWrapper,
)

log = logging.getLogger(__name__)

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


class PyroFunctionWrapper:
    """Wrapper class to safely wrap callable responses as Proxy objects."""

    def __init__(
        self,
        callable: Callable[P, T],
        loop: asyncio.AbstractEventLoop,
        execute_on_pyro_daemon_overload: bool,
    ) -> None:
        self.callable = callable
        self._loop = loop
        # Wrapped callbacks inherit their parent resource's ruleset regarding inbound call execution
        self._execute_on_pyro_daemon_overload = execute_on_pyro_daemon_overload

    @property
    def is_callable(self) -> bool:
        """Callable status for validation of a wrapped function, always true."""
        return True

    def call(self, *args: P.args, **kwargs: P.kwargs) -> Any:  # type: ignore
        """Remote deployable function call."""
        return self.callable(*args, **kwargs)


class PyroAsyncFunctionWrapper:
    """Wrapper class to safely wrap async callable responses as Proxy objects."""

    def __init__(
        self,
        callable: Callable[P, T],
        loop: asyncio.AbstractEventLoop,
        execute_on_pyro_daemon_overload: bool,
    ) -> None:
        self.callable = callable
        self._loop = loop
        # Wrapped callbacks inherit their parent resource's ruleset regarding inbound call execution
        self._execute_on_pyro_daemon_overload = execute_on_pyro_daemon_overload

    @property
    def is_awaitable(self) -> bool:
        """Awaitable status for validation of a wrapped function, indicates if a callback is async, always true."""
        return True

    def call(self, *args: P.args, **kwargs: P.kwargs) -> Any:  # type: ignore
        """Remote deployable asynchronous function call."""
        return asyncio.run_coroutine_threadsafe(
            coro=self.callable(*args, **kwargs),  # type: ignore
            loop=self._loop,
        ).result()


class _ResultMeta(enum.Enum):
    """Result type metadata for attributes that are wrapped in special PyroBehaviors."""

    PROXY = enum.auto()
    UNKNOWN = enum.auto()


class _PyroSpecialBehavior(BaseModel):
    specialty_function: Callable[[DaemonUtility, Any, str, Any], Any]
    apply_local: bool


def pyro_behavior(
    specialty_func: Callable[P, T], apply_local: bool
) -> Callable[[T], T]:
    """Decorator to indicate to the PyroSynchronousObject adapter that a function must be bound with a special method.

    This works by adding the `specialty_func` to the original function as metadata, to be used by the PyroSynchronousObject
    constructor when building the alias attributes.

    Params:
        specialty_func: The wrapper method that will be used when binding a decorated attribute of an object instance.
        apply_local: Boolean to determine if this specialty function should wrap the attribute on the PyroSynchronousObject or
                     on the original object instance. Setting to True applies the specialty function to the original instance.
    """

    def decorator(func: Callable[[T], T]) -> Callable[[T], T]:
        func._pyro_specialty_behavior = _PyroSpecialBehavior(  # type: ignore
            specialty_function=specialty_func,  # type: ignore
            apply_local=apply_local,
        )
        return func

    return decorator  # type: ignore


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
    async_methods: dict[str, dict[str, Any]] = {}
    proxy_attributes: list[str] = []
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
                except (TypeError, AttributeError):
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
                if inspect.iscoroutinefunction(attr):
                    async_metadata = _build_metadata_dictionary(attr)
                    async_methods[name] = async_metadata

                result_meta = _determine_attribute_result_metadata(
                    specialty_behavior.specialty_function
                )
                # NOTE: extend this further as needed for custom result types
                if result_meta is _ResultMeta.PROXY:
                    proxy_attributes.append(name)

                exposed = pyro.expose(
                    specialty_behavior.specialty_function(utility, core_obj, name, attr)
                )
                yield (name, exposed)
            elif isinstance(attr, FunctionType) and inspect.iscoroutinefunction(attr):
                # Wrap coroutines in a synchronous function call, bound it to the original instance and expose the wrapped method
                exposed = pyro.expose(synchronous(attr))
                # Track the known async functions so they may be provided as metadata to a client wrapper
                async_metadata = _build_metadata_dictionary(attr)
                async_methods[name] = async_metadata

                # Bound methods to the original instance unless they are staticmethods
                if isinstance(
                    inspect.getattr_static(core_obj.__class__, name), staticmethod
                ):
                    bound_method = exposed  # type: ignore
                else:
                    bound_method = MethodType(exposed, core_obj)
                yield (name, parameter_validation_wrapper(bound_method))
            elif isinstance(attr, FunctionType):
                # Expose standard functions and bound the exposed function to the original instance
                exposed = pyro.expose(attr)
                # Bound methods to the original instance unless they are staticmethods
                if isinstance(
                    inspect.getattr_static(core_obj.__class__, name), staticmethod
                ):
                    bound_method = exposed  # type: ignore
                else:
                    bound_method = MethodType(exposed, core_obj)
                yield (
                    name,
                    parameter_validation_wrapper(
                        execute_inbound_call_on_event_loop(core_obj, bound_method)
                    ),
                )
            elif inspect.ismethod(attr) and inspect.iscoroutinefunction(attr):
                # Wrap classmethod coroutines in a synchronous function call, and expose on the PSO
                exposed = pyro.expose(synchronous(attr))
                async_metadata = _build_metadata_dictionary(attr)
                async_methods[name] = async_metadata

                yield (name, parameter_validation_wrapper(exposed))
            elif inspect.ismethod(attr):
                # Expose classmethods on the PSO
                method_handler = execute_inbound_call_on_event_loop(core_obj, attr)
                exposed = pyro.expose(method_handler)
                yield (
                    name,
                    parameter_validation_wrapper(exposed),
                )
            elif isinstance(attr, property):
                # Bound property to the original instance through the inbound call executor and expose the bounded property
                exposed = pyro.expose(
                    execute_inbound_call_on_event_loop(core_obj, attr)  # type: ignore
                )
                yield (name, exposed)
                if attr.fset:
                    bound_method = MethodType(pyro.expose(attr.fset), core_obj)
                    exposed_fset = execute_inbound_call_on_event_loop(
                        core_obj, bound_method
                    )
                    yield (name + "__fset", parameter_validation_wrapper(exposed_fset))
                if attr.fdel:
                    bound_method = MethodType(pyro.expose(attr.fdel), core_obj)
                    exposed_fdel = execute_inbound_call_on_event_loop(
                        core_obj, bound_method
                    )
                    yield (name + "__fdel", parameter_validation_wrapper(exposed_fdel))

    # Attach the known async methods list to the PSO as a private member and expose a getter method
    yield ("_pyro_async_methods", async_methods)
    yield ("get_pyro_async_methods", pyro.expose(property(get_pyro_async_methods)))  # type: ignore
    # Attach an proxy-providing methods list to the PSO as a private member and expose a getter method
    yield ("_pyro_attributes_with_proxy_results", proxy_attributes)
    yield (
        "get_pyro_attributes_with_proxy_result",
        pyro.expose(property(get_pyro_attributes_with_proxy_result)),  # type: ignore
    )

    # Attach the `core_obj` instance as a private member for internal tracking
    try:
        # If the `core_obj` contains a weakref then for tracking we yield the inner instance
        yield ("_core_obj", core_obj.__weakref__())
    except (TypeError, AttributeError):
        yield ("_core_obj", core_obj)


### Helpers ###


def _build_metadata_dictionary(attr: Any) -> Dict[str, Any]:
    return {
        "__module__": attr.__module__,
        "__name__": attr.__name__,
        "__qualname__": attr.__qualname__,
        "__doc__": attr.__doc__,
        "__type_params__": attr.__type_params__,
    }


def _determine_attribute_result_metadata(specialty_func: Any) -> _ResultMeta:
    # Determines the result metadata for an attribute wrapped in a speciality function
    if (
        specialty_func.__name__ == "convert_result_to_proxy"
        or specialty_func.__name__ == "convert_result_to_dict_of_proxies"
    ):
        return _ResultMeta.PROXY
    # NOTE: extend this further as needed in the future for other custom return types
    return _ResultMeta.UNKNOWN


def _get_specialty_behavior(func: Any, name: str) -> _PyroSpecialBehavior | None:
    if inspect.iscoroutinefunction(func) or isinstance(func, FunctionType):
        if hasattr(func, "_pyro_specialty_behavior"):
            return func._pyro_specialty_behavior  # type: ignore
    elif isinstance(func, property):
        if hasattr(func.fget, "_pyro_specialty_behavior"):
            return func.fget._pyro_specialty_behavior  # type: ignore
    return None


def get_pyro_async_methods(self: Any) -> dict[str, dict[str, Any]]:
    """Helper function to access the dictionary of known async method metadata on a PyroSynchronousObject."""
    result: dict[str, dict[str, Any]] = self._pyro_async_methods
    return result


def get_pyro_attributes_with_proxy_result(self: Any) -> list[str]:
    """Helper function to access the list of known methods that provide their results as Proxies."""
    result: list[str] = self._pyro_attributes_with_proxy_results
    return result


# Validators


def _validated_parameters(*args: P.args, **kwargs: P.kwargs) -> tuple[tuple, dict]:  # type: ignore
    def _validations(arg: Any) -> Any:
        # NOTE: Extend this as further validations are needed
        arg = _validate_inbound_proxy(arg)
        arg = _validate_inbound_iterable(arg)
        return arg

    validated_args = tuple()  # type: ignore
    for arg in args:
        # Validate each non-keyword argument and reconstruct the argument tuple
        validated_args = (*validated_args, _validations(arg))
    # Validate each keyword argument and reconstruct the kwargs dictionary
    kwargs = {key: _validations(kwargs[key]) for key in kwargs.keys()}
    return (validated_args, kwargs)


def _validate_inbound_proxy(arg: Any) -> Any:
    """Handle an argument which is a remote Proxy that may have been forwarded through multiple processes."""
    if isinstance(arg, pyro.Proxy):
        # NOTE: Cases like this are the result of multi-process callback forwarding
        if "is_callable" in arg._pyroAttrs:
            arg = ClientPyroFunctionWrapper(proxy=arg)
        elif "is_awaitable" in arg._pyroAttrs:
            arg = AsyncClientPyroFunctionWrapper(proxy=arg)
        else:
            try:
                iter(arg)
                validated_arg = []
                for r in arg:
                    validated_arg.append(AsyncClientPyroObject(r))
                arg = validated_arg
            except AttributeError:
                arg = AsyncClientPyroObject(arg)
    return arg


def _validate_inbound_iterable(arg: Any) -> Any:
    """Handle an argument which is an iterable that has been made safe for transport."""
    if isinstance(arg, dict) and "_pyro_safe_translation" in arg:
        # This dictionary is a pyro safe translation of a type, use that type to convert here
        if arg["_pyro_safe_translation"] == "set":
            arg = set(arg["data"])
        else:
            ValueError(
                f"Inbound validation does not support format: {arg['_pyro_safe_translation']}"
            )
    return arg


def parameter_validation_wrapper(attr: Callable[P, T]) -> Callable[P, T]:
    """Validate incoming parameters on any generically generated PSO bound method function call."""

    @functools.wraps(attr)
    def wrapper(self: Any, *args: P.args, **kwargs: P.kwargs) -> Any:  # noqa: C901
        # Of note, the wrapper passes self to terminate the self instance passed by the PSO
        args, kwargs = _validated_parameters(*args, **kwargs)  # type: ignore
        return attr(*args, **kwargs)

    return wrapper  # type: ignore


def execute_inbound_call_on_event_loop(  # noqa: C901
    core_obj: Any, attr: Callable[P, T]
) -> Callable[P, T]:
    """Wrapper to ensure that inbound calls are executed on the resource's native event loop.

    This wrapper operates on the assumption it is recieveing a method bound to its original core object.
    This is only to be used on non-async methods and attributes, as async methods are already wrapped
    through the `synchronous` decorator.
    """

    def wrap_sync_safe(
        loop: asyncio.AbstractEventLoop,
        method: Callable[P, T],
        *args: P.args,
        **kwargs: P.kwargs,
    ) -> Any:
        async def method_wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:
            return method(*args, **kwargs)

        future = asyncio.run_coroutine_threadsafe(
            coro=method_wrapper(*args, **kwargs), loop=loop
        )
        return future.result()

    def wrap_property_sync_safe(loop: asyncio.AbstractEventLoop, attribute: str) -> Any:
        async def property_wrapper(attribute: str) -> Any:
            return getattr(core_obj, attribute)

        return asyncio.run_coroutine_threadsafe(
            property_wrapper(attribute), loop
        ).result()

    @functools.wraps(attr)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:  # noqa: C901
        # Grab the active event loop off the core object this was bound with
        loop: Optional[asyncio.AbstractEventLoop] = getattr(core_obj, "_loop", None)

        if hasattr(core_obj, "_execute_on_pyro_daemon_overload"):
            # If the core object has been provided an `execute_on_pyro_daemon_overload` then it should be called from
            # The thread of the request handler. These are move likely calls coming from the robot-server or a resource
            # that will not have access to it's host process's event loop. Calls like this are expected to be threadsafe
            # in their host process.
            if isinstance(attr, MethodType):
                return attr(*args, **kwargs)
            elif isinstance(attr, property):
                return getattr(core_obj, attr.fget.__name__)
            else:
                raise ValueError(
                    "Provided base attribute of a daemon overload resource must be a Property or a Method."
                )

        try:
            running_loop = asyncio.get_running_loop()
        except RuntimeError:
            # There is no running loop
            running_loop = None

        # If the loop is running and is not the current running loop, we can execute synchronously
        if loop is not None and loop.is_running():
            if running_loop is loop:
                # We're in the same thread and the loop is running, cannot block synchronously.
                raise RuntimeError("Cannot execute call from the same event loop.")

            if isinstance(attr, MethodType):
                result = wrap_sync_safe(loop, attr, *args, **kwargs)
            elif isinstance(attr, property):
                result = wrap_property_sync_safe(loop, attr.fget.__name__)
            else:
                raise ValueError(
                    "Provided base attribute must be a Property or a Method."
                )
            return result
        else:
            raise RuntimeError(
                "Instance event loop is not running inside inbound call executor."
            )

    if isinstance(attr, property):
        # If the original attribute was a property, ensure the wrapped attribute is
        return property(wrapper)
    return wrapper


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
    def wrapper(self: Any, *args: P.args, **kwargs: P.kwargs) -> Any:  # noqa: C901
        # Of note, the wrapper passes self to terminate the self instance passed by the PSO
        args, kwargs = _validated_parameters(*args, **kwargs)  # type: ignore
        if inspect.iscoroutinefunction(attr):
            sync_func = synchronous(attr)
            bound_method = MethodType(sync_func, core_obj)
            result = bound_method(*args, **kwargs)
        elif isinstance(attr, FunctionType):
            bound_method = execute_inbound_call_on_event_loop(  # type: ignore
                core_obj, MethodType(attr, core_obj)
            )
            result = bound_method(*args, **kwargs)
        elif isinstance(attr, property):
            bound_property = execute_inbound_call_on_event_loop(core_obj, attr)
            result = bound_property.fget()
        else:
            raise ValueError(
                "Provided base attribute must be a Property, a Method or an Async method."
            )
        # Convert the instance result to PSO(s) and return the Proxy objects
        if result is None:
            return None
        try:
            proxy_list = []
            for r in result:
                pyro_synchronous_obj = utility.find_PSO(r)
                if pyro_synchronous_obj is None:
                    if not hasattr(r, "_loop"):
                        # Append the parents event loop to the child object for PSO forwarding
                        setattr(r, "_loop", core_obj._loop)
                    pyro_synchronous_obj = PyroSynchronousObject(r, utility)
                    utility.add_PSO(pyro_synchronous_obj)
                proxy_list.append(utility.proxy_for(pyro_synchronous_obj))
            return proxy_list
        except TypeError:
            if isinstance(result, FunctionType) or isinstance(result, MethodType):
                # Wrap callable result in Proxy-safe format
                # For execute on daemon overload rules, a child callable (PyroFunctionWrapper)
                # must inherit it's parents execution ruleset.
                execute_overload_ruleset = False
                if hasattr(core_obj, "_execute_on_pyro_daemon_overload"):
                    execute_overload_ruleset = True
                # Handle synchronous and asynchronous callable wrapping
                if inspect.iscoroutinefunction(result):
                    result = PyroAsyncFunctionWrapper(
                        result, core_obj._loop, execute_overload_ruleset
                    )
                else:
                    result = PyroFunctionWrapper(
                        result, core_obj._loop, execute_overload_ruleset
                    )
            pyro_synchronous_obj = utility.find_PSO(result)
            if pyro_synchronous_obj is None:
                if not hasattr(result, "_loop"):
                    # Append the parents event loop to the child object for PSO forwarding
                    setattr(result, "_loop", core_obj._loop)
                pyro_synchronous_obj = PyroSynchronousObject(result, utility)
                utility.add_PSO(pyro_synchronous_obj)
            return utility.proxy_for(pyro_synchronous_obj)

    if isinstance(attr, property):
        # If the original attribute was a property, ensure the wrapped attribute is
        return property(wrapper)
    return wrapper  # type: ignore


def convert_result_to_dict_of_proxies(  # noqa: C901
    utility: DaemonUtility, core_obj: Any, name: str, attr: Callable[P, T]
) -> Callable[P, T]:
    """Wrapper to change the output of a function to a Dictionary of PyroSynchronousObjects.

    This function is intended for use with `pyro_behavior` and is executed when called through a Pyro Proxy.
    The result(s) will be newly instanced Proxy object(s) on the Daemon. This is particularly useful for instances
    that return a dictionary of contained instances, such as an OT3API with internal Dictionary of Pipettes.
    """

    @functools.wraps(attr)
    def wrapper(self: Any, *args: P.args, **kwargs: P.kwargs) -> Any:  # noqa: C901
        # Of note, the wrapper passes self to terminate the self instance passed by the PSO
        args, kwargs = _validated_parameters(*args, **kwargs)  # type: ignore
        if inspect.iscoroutinefunction(attr):
            sync_func = synchronous(attr)
            bound_method = MethodType(sync_func, core_obj)
            result = bound_method(*args, **kwargs)
            return_types = attr.__annotations__["return"]
        elif isinstance(attr, FunctionType):
            bound_method = execute_inbound_call_on_event_loop(  # type: ignore
                core_obj, MethodType(attr, core_obj)
            )
            result = bound_method(*args, **kwargs)
            return_types = attr.__annotations__["return"]
        elif isinstance(attr, property):
            bound_property = execute_inbound_call_on_event_loop(core_obj, attr)
            result = bound_property.fget()
            return_types = attr.fget.__annotations__["return"]
        else:
            raise ValueError(
                "Provided base attribute must be a Property, a Method or an Async method."
            )
        # Convert the instance result to PSO(s) and return the Proxy objects
        if result is None:
            return None

        if isinstance(result, dict):
            proxy_dict = {}
            try:
                for key, value in result.items():
                    if value is not None:
                        pyro_synchronous_obj = utility.find_PSO(value)
                        if pyro_synchronous_obj is None:
                            if not hasattr(value, "_loop"):
                                # Append the parents event loop to the child object for PSO forwarding
                                setattr(value, "_loop", core_obj._loop)
                            pyro_synchronous_obj = PyroSynchronousObject(value, utility)
                            utility.add_PSO(pyro_synchronous_obj)
                        proxy_dict[key] = utility.proxy_for(pyro_synchronous_obj)
                    else:
                        proxy_dict[key] = None  # type: ignore

                # Format Proxy Dictionary into a safe-for-transport NonBuiltinKeyDictWrapper
                if hasattr(return_types, "__args__"):
                    key_type, value_type = return_types.__args__
                    # Filter out `typing.Optional`` typings to the inner type, only works for non-tuples
                    # todo(chb: 2025-04-01): Catch and error on cases where we have optional tuples, does that even happen?
                    try:
                        key_type = next(
                            a for a in key_type.__args__ if a is not type(None)
                        )
                    except AttributeError:
                        pass
                    wrapped_proxy_dict = NonBuiltinKeyDictWrapper(
                        dictionary=proxy_dict,
                        key_type=".".join((key_type.__module__, key_type.__qualname__)),
                        value_type=PYRO_PROXY,
                    )
                    return wrapped_proxy_dict
                else:
                    raise ValueError(
                        "Pyro behavior for proxy dictionary wrapping requires function return types."
                    )
            except Exception as e:
                raise ValueError(f"err: {e} result is: {result}")
        else:
            raise ValueError(
                "Pyro behavior for proxy dictionary wrapping is only available for use with dictionaries of instances."
            )

    if isinstance(attr, property):
        # If the original attribute was a property, ensure the wrapped attribute is
        return property(wrapper)
    return wrapper  # type: ignore


def convert_result_to_wrapped_dict(  # noqa: C901
    utility: DaemonUtility, core_obj: Any, name: str, attr: Callable[P, T]
) -> Callable[P, T]:
    """Wrapper that ensures a result of a method call through Pyro is a wrapped dictionary.

    The result of this is later deserialized by serpent using special registries for NonBuiltinKeyDictWrapper. This
    particularly pertains to dictionary results that may contain keys which are mutable, such as SubSystem.
    """

    @functools.wraps(attr)
    def wrapper(self: Any, *args: P.args, **kwargs: P.kwargs) -> Any:
        # Of note, the wrapper passes self to terminate the self instance passed by the PSO
        args, kwargs = _validated_parameters(*args, **kwargs)  # type: ignore
        if inspect.iscoroutinefunction(attr):
            sync_func = synchronous(attr)
            bound_method = MethodType(sync_func, core_obj)
            result = bound_method(*args, **kwargs)
            return_types = attr.__annotations__["return"]
        elif isinstance(attr, FunctionType):
            bound_method = execute_inbound_call_on_event_loop(  # type: ignore
                core_obj, MethodType(attr, core_obj)
            )
            result = bound_method(*args, **kwargs)
            return_types = attr.__annotations__["return"]
        elif isinstance(attr, property):
            bound_property = execute_inbound_call_on_event_loop(core_obj, attr)
            result = bound_property.fget()
            return_types = attr.fget.__annotations__["return"]
        else:
            raise ValueError(
                "Provided base attribute must be a Property, a Method or an Async method."
            )
        if isinstance(result, dict):
            if hasattr(return_types, "__args__"):
                key_type, value_type = return_types.__args__
                # Filter out `typing.Optional`` typings to the inner type, only works for non-tuples
                # todo(chb: 2025-04-01): Catch and error on cases where we have optional tuples, does that even happen?
                try:
                    key_type = next(a for a in key_type.__args__ if a is not type(None))
                except AttributeError:
                    pass
                try:
                    value_type = next(
                        a for a in value_type.__args__ if a is not type(None)
                    )
                except AttributeError:
                    pass
                wrapped_dict = NonBuiltinKeyDictWrapper(
                    dictionary=result,
                    key_type=".".join((key_type.__module__, key_type.__qualname__)),
                    value_type=".".join(
                        (value_type.__module__, value_type.__qualname__)
                    ),
                )
                return wrapped_dict
            else:
                raise ValueError(
                    "Pyro behavior for dictionary wrapping requires function return types."
                )
        else:
            raise ValueError(
                "Pyro behavior for dictionary wrapping is only available for use with dictionaries."
            )

    if isinstance(attr, property):
        # If the original attribute was a property, ensure the wrapped attribute is
        return property(wrapper)
    return wrapper  # type: ignore


def convert_type_to_instance(
    utility: DaemonUtility, core_obj: Any, name: str, attr: Callable[P, T]
) -> Callable[P, T]:
    """Wrapper that enforces functions that return Types and not instances to return an instance of that type.

    On the other end, it is expected that the serpent serializer will have a specialized handler strip the
    result and return the original type as intended.
    """

    @functools.wraps(attr)
    def wrapper(self: Any, *args: P.args, **kwargs: P.kwargs) -> Any:
        args, kwargs = _validated_parameters(*args, **kwargs)  # type: ignore
        if inspect.iscoroutinefunction(attr):
            sync_func = synchronous(attr)
            result = sync_func(self, *args, **kwargs)
        elif isinstance(attr, FunctionType):
            bound_method = execute_inbound_call_on_event_loop(
                core_obj, MethodType(attr, core_obj)
            )
            result = bound_method(*args, **kwargs)
        elif isinstance(attr, property):
            bound_property = execute_inbound_call_on_event_loop(core_obj, attr)
            result = bound_property.fget()
        else:
            raise ValueError(
                "Provided base attribute must be a Property, a Method or an Async method."
            )
        if isinstance(result, type):
            return result()
        else:
            raise ValueError(
                "Pyro behavior for type to instance conversion is only available for use with pure types."
            )

    return wrapper  # type: ignore


def convert_result_to_wrapped_typed_dict(
    utility: DaemonUtility, core_obj: Any, name: str, attr: Callable[P, T]
) -> Callable[P, T]:
    """Wrapper that ensures a result of a method call through Pyro is a wrapped Typed Dict.

    The result of this is later deserialzed by serpent using special registries for TypedDictWrapper. This
    is useful for complex Typed Dictionaries such as PipetteDict that require reconstruction.
    """

    @functools.wraps(attr)
    def wrapper(self: Any, *args: P.args, **kwargs: P.kwargs) -> Any:
        args, kwargs = _validated_parameters(*args, **kwargs)  # type: ignore
        if inspect.iscoroutinefunction(attr):
            sync_func = synchronous(attr)
            bound_method = MethodType(sync_func, core_obj)
            result = bound_method(*args, **kwargs)
            return_type = attr.__annotations__["return"]
        elif isinstance(attr, FunctionType):
            bound_method = execute_inbound_call_on_event_loop(  # type: ignore
                core_obj, MethodType(attr, core_obj)
            )
            result = bound_method(*args, **kwargs)
            return_type = attr.__annotations__["return"]
        elif isinstance(attr, property):
            bound_property = execute_inbound_call_on_event_loop(core_obj, attr)
            result = bound_property.fget()
            return_type = attr.fget.__annotations__["return"]
        else:
            raise ValueError(
                "Provided base attribute must be a Property, a Method or an Async method."
            )
        if isinstance(result, dict):
            return TypedDictWrapper(
                dictionary=result,
                typed_dict_name=".".join(
                    (return_type.__module__, return_type.__qualname__)
                ),
            )
        else:
            raise ValueError(
                "Pyro behavior for Typed Dict wrapping is only available for use with dictionaries."
            )

    return wrapper  # type: ignore


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
