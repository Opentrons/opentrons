"""Class wrapper that ingests a PyroSynchronousObject and maps 'synchronized' async functions to awaitable methods."""

import asyncio
import logging
from typing import Any, Iterator, ParamSpec, TypeVar

import Pyro5.api

from opentrons.util.pyro.pyro_serialization import NonBuiltinKeyDictWrapper

log = logging.getLogger(__name__)

T = TypeVar("T")
P = ParamSpec("P")


class ClientPyroFunctionWrapper:
    """Wrapper class to make Proxy response objects callable."""

    def __init__(
        self,
        proxy: Pyro5.api.Proxy,
    ) -> None:
        self._proxy = proxy
        self.validated_call = wrap_parameter_validation(self._proxy, "call")

    def __call__(self, *args: P.args, **kwargs: P.kwargs) -> Any:  # type: ignore
        """Overload client-side call references with proxy-safe callable reference."""
        return self.validated_call(self, *args, **kwargs)


class AsyncClientPyroFunctionWrapper:
    """Wrapper class to make Async Proxy response objects callable and awaitable."""

    def __init__(
        self,
        proxy: Pyro5.api.Proxy,
    ) -> None:
        self._proxy = proxy
        self.validated_call = wrap_parameter_validation(self._proxy, "call")

    async def __call__(self, *args: P.args, **kwargs: P.kwargs) -> Any:  # type: ignore
        """Overload client-side async call references with proxy-safe synchronized callable reference."""
        return self.validated_call(self, *args, **kwargs)


class _ACPO:
    pass


def AsyncClientPyroObject(
    pyro_synchronous_object: Pyro5.api.Proxy, force_synchronous: bool = False
) -> _ACPO:
    """A Wrapper Class constructor to take a PyroSynchronousObject Proxy and make calls awaitable.

    The purpose of this class re-constructor is to create an object with all the attributes of a Proxy object
    that was created from a PyroSynchronousObject. The attributes which were originally async but were 'synchronized'
    by the PyroSynchronousObject constructor will be wrapped to be awaitable again. Standard method calls and
    property attributes will be forwarded as usual.

    If `force_synchronous` is set to `True`, we instead keep the async methods `synchronized`. This is useful if
    the proxy is being used in a situation where async calls need to be made synchronous to begin with. This way
    we do not need to ping pong back and forth between async and non-async wrapping.

    Proxy wrapping Example:
    -------
    An example of this would be with a remote call to an `OT3API` instance which has been wrapped and hosted.
    .. code-block::
    >>> import Pyro5.api as pyro
    >>> ot3_uri = pyro.resolve("PYRONAME:OT3API")
    >>> ot3_proxy = pyro.Proxy(ot3_uri)
    >>> # ... At this point, `ot3_proxy` is a Proxy of a PyroSynchronousObject ...
    >>> async_ot3 = AsyncClientPyroObject(ot3_proxy)
    >>> # ... Now asynchronous `async_ot3` attributes can be awaited ...
    >>> await async_ot3.home()
    """
    AsyncCls = type(
        f"AsyncClientPyroObject_{pyro_synchronous_object.__class__.__name__}_{id(pyro_synchronous_object)}",
        (_ACPO,),
        dict(_build_classdict(pyro_synchronous_object, force_synchronous)),
    )
    return AsyncCls()  # type: ignore


def _build_classdict(
    pso: Pyro5.api.Proxy,
    force_synchronous: bool,
) -> Iterator[tuple[str, Any]]:
    # ensures metadata is available
    pso._pyroBind()  # type: ignore
    async_methods: dict[str, dict[str, Any]] = _get_async_methods(pso)
    async_method_names = [method["__name__"] for method in async_methods.values()]
    # Attach PSO exposed methods to the AsyncClientPyroObject
    for method in pso._pyroMethods:
        if "__fset" in method or "__fdel" in method:
            # Ignore exposed property attributes
            pass
        elif method in async_method_names and not force_synchronous:
            # For methods that are awaitable wrap them as an async reference that forwards the call to the PSO Proxy.
            method_metadata: dict[str, Any] = async_methods[method]
            async_method = wrap_as_async(method_metadata)
            yield method, async_method
        else:
            # For standard method calls forward the direct call to the method on the PSO Proxy.
            yield method, wrap_parameter_validation(pso, method)
    # Attach PSO exposed attributes to the AsyncClientPyroObject
    for attr in pso._pyroAttrs:
        # For property attributes we use to attach a wrapped `getattr` call for that attribute.
        # If setter and deleter functions exist on the server-side alias they are reconstructed client-side here.
        # This is set as a new property of the AsyncClientPyroObject that forwards calls to the PSO Proxy.

        fset = None
        fdel = None
        if attr + "__fset" in pso._pyroMethods:
            fset = wrap_parameter_validation(pso, attr + "__fset")
        if attr + "__fdel" in pso._pyroMethods:
            fdel = wrap_parameter_validation(pso, attr + "__fdel")
        prop = property(
            fget=wrap_property(pso, attr),
            fset=fset,
            fdel=fdel,
        )
        yield (
            attr,
            prop,
        )
    yield "_proxy", pso


### Helpers ###


def _get_async_methods(proxy: Pyro5.api.Proxy) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = getattr(proxy, "get_pyro_async_methods", {})
    return result


def _get_thread_proxy(proxy: Pyro5.api.Proxy) -> Pyro5.api.Proxy:
    """Get or create a thread-local proxy for the given URI, to prevent request lockout.

    Pyro server daemon's handle multiple requests based on proxy connections, so to prevent a
    deadlock we create a proxy per request, which is then closed by the requesting caller.
    """
    new_proxy = Pyro5.api.Proxy(proxy._pyroUri)  # type: ignore[no-untyped-call]

    return new_proxy


def wrap_as_async(method_metadata: dict[str, Any]) -> Any:
    """Wrapper to make a callable element on a PyroSynchronousObject into an awaitable element on a AsyncClientPyroObject."""

    async def wrapper(self: Any, *args: P.args, **kwargs: P.kwargs) -> Any:  # type: ignore
        def _thread_call(
            proxy: Pyro5.api.Proxy,
            func_name: str,
            *args: P.args,  # type: ignore
            **kwargs: P.kwargs,  # type: ignore
        ) -> Any:
            validated_func = wrap_parameter_validation(proxy, func_name)
            return validated_func(self, *args, **kwargs)

        return await asyncio.to_thread(
            _thread_call, self._proxy, method_metadata["__name__"], *args, **kwargs
        )

    # Construct the metadata of the client wrapper function
    wrapper.__module__ = method_metadata["__module__"]
    wrapper.__name__ = method_metadata["__name__"]
    wrapper.__qualname__ = method_metadata["__qualname__"]
    wrapper.__doc__ = method_metadata["__doc__"]
    wrapper.__type_params__ = method_metadata["__type_params__"]

    return wrapper


def wrap_property(proxy: Pyro5.api.Proxy, attr: str) -> Any:
    """Wrapper to produce a call forward to a specified attribute of a Proxy object.

    This will take the provided Proxy instance and ensure a thread-safe version is executed upon.
    """

    def _property_result(proxy: Pyro5.api.Proxy, current_attr: str) -> Any:
        # Ensure the proxy connection is gracefully released
        with _get_thread_proxy(proxy) as threadsafe_proxy:
            result = getattr(threadsafe_proxy, current_attr)
        return result

    return lambda self, current_attr=attr: wrap_result_validation(
        proxy,
        attr,
        _property_result(proxy, current_attr),
    )


### Parameter Validations


def wrap_parameter_validation(proxy: Pyro5.api.Proxy, func_name: str) -> Any:
    """Validate outbound parameter requests before allowing serialization."""

    def wrapper(self: Any, *args: P.args, **kwargs: P.kwargs) -> Any:  # type: ignore
        # Validate individual arguments before forwarding the call
        def _validations(arg: Any) -> Any:
            # NOTE: Extend this as further validations are needed
            arg = _validate_keys_builtins(arg)
            arg = _validate_outbound_proxy(arg)
            arg = _validate_outbound_nested_proxy(arg)
            return arg

        validated_args = tuple()  # type: ignore
        for arg in args:
            # Validate each non-keyword argument and reconstruct the argument tuple
            validated_args = (*validated_args, _validations(arg))
        # Validate each keyword argument and reconstruct the kwargs dictionary
        kwargs = {key: _validations(kwargs[key]) for key in kwargs.keys()}
        # Ensure the proxy connection is gracefully released
        with _get_thread_proxy(proxy) as threadsafe_proxy:
            threadsafe_attr = getattr(threadsafe_proxy, func_name)
            result = threadsafe_attr(*validated_args, **kwargs)
        return wrap_result_validation(proxy, func_name, result)

    return wrapper


# Hashable dictionary parameter validation
def _validate_keys_builtins(arg: Any) -> Any:
    """Handle an argument which is a dictionary and contains keys that are NOT builtins.

    This function will handle those by stripping out the types for a given key and value (multityped dictionaries
    not supported) and wrapping the entire dictionary and these known types into an NonBuiltinKeyDictWrapper. This
    will then be deserialized back into it's original form by the OpentronsPyroSerializer library.
    """
    if isinstance(arg, dict):
        if not all(k.__class__.__module__ == "builtins" for k in arg.keys()):
            if all(
                isinstance(key, type(list(arg.keys())[0])) for key in arg.keys()
            ) and all(
                isinstance(value, type(list(arg.values())[0])) for value in arg.values()
            ):
                key_type = type(list(arg.keys())[0])
                value_type = type(list(arg.values())[0])
            else:
                raise KeyError(
                    "Async Client Pyro Object does not support transmission of multitype unhashable dictionaries."
                )
            return NonBuiltinKeyDictWrapper(
                dictionary=arg,
                key_type=".".join((key_type.__module__, key_type.__qualname__)),
                value_type=".".join((value_type.__module__, value_type.__qualname__)),
            )
    return arg


def _validate_outbound_proxy(arg: Any) -> Any:
    """Handle an argument which is a wrapped proxy such as a callback Function Wrapper or Async Client Pyro Object.

    For roundtrip functions, which may be sent across multiple processes, we only want to perserve the inner Proxy.
    """
    if hasattr(arg, "_proxy"):
        arg = arg._proxy

    return arg


def _validate_outbound_nested_proxy(arg: Any) -> Any:  # noqa: C901
    """Handle an argument which may contain a nested wrapped proxy, such as a callback Function Wrapper or Async Client Pyro Object.

    For roundtrip functions, which may be sent across multiple processes, we only want to perserve the inner Proxy while maintaining the shape of argument.
    """
    if type(arg) is tuple:
        validated_tuple: tuple[Any, ...] = ()
        for inner in arg:
            if hasattr(inner, "_proxy"):
                validated_tuple = (*validated_tuple, inner._proxy)
            else:
                validated_tuple = (*validated_tuple, inner)
        return validated_tuple
    elif isinstance(arg, dict):
        validated_dict: dict[Any, Any] = {}
        for inner_key, inner_val in arg.items():
            if hasattr(inner_val, "_proxy"):
                validated_dict[inner_key] = inner_val._proxy
            else:
                validated_dict[inner_key] = inner_val
        return validated_dict
    elif isinstance(arg, list):
        validated_list = []
        for inner in arg:
            if hasattr(inner, "_proxy"):
                validated_list.append(inner._proxy)
            else:
                validated_list.append(inner)
        return validated_list

    return arg


### Result Validations


def wrap_result_validation(proxy: Pyro5.api.Proxy, func_name: str, result: Any) -> Any:  # noqa: C901
    """Validate incoming result format before returning from a remote call.

    This is not to be confused with serialization. The validation process can be used to reformat
    result data into more client-acceptable shapes. For example, autowrapping of Proxy responses
    as AsyncClientPyroObjects.
    """
    validated_result = result
    # Ensure the proxy connection is gracefully released
    with _get_thread_proxy(proxy) as threadsafe_proxy:
        attributes_with_proxy_result: list[str] = getattr(
            threadsafe_proxy, "get_pyro_attributes_with_proxy_result", []
        )

    if func_name in attributes_with_proxy_result:
        # Check if the result is a list of proxies or singular entity
        if result is None:
            return None
        try:
            if result.is_callable:
                # Determine if proxy is a callback
                validated_result = ClientPyroFunctionWrapper(result)
        except AttributeError:
            try:
                if result.is_awaitable:
                    # Determine if proxy is an async callback
                    validated_result = AsyncClientPyroFunctionWrapper(result)
            except AttributeError:
                # Handle dictionaries of Proxies
                if isinstance(result, dict):
                    new_dict = {}
                    for key, value in result.items():
                        # Dictionary values are optional for Pyro dictionaries, so handle None case while assigning
                        new_dict[key] = (
                            AsyncClientPyroObject(value)
                            if isinstance(value, Pyro5.api.Proxy)
                            else None
                        )
                    validated_result = new_dict

                else:
                    try:
                        # Attempt to handle a list of Proxies
                        iter(result)
                        validated_result = []
                        for r in result:
                            assert isinstance(r, Pyro5.api.Proxy)
                            validated_result.append(AsyncClientPyroObject(r))
                    except AttributeError:
                        # Handle a single Proxy instance
                        assert isinstance(result, Pyro5.api.Proxy)
                        validated_result = AsyncClientPyroObject(result)

    return validated_result
