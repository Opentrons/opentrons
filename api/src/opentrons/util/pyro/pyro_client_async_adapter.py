"""Class wrapper that ingests a PyroSynchronousObject and maps 'synchronized' async functions to awaitable methods."""

import asyncio
from typing import Any, Iterator, ParamSpec, TypeVar

import Pyro5.api

T = TypeVar("T")
P = ParamSpec("P")


class _ACPO:
    pass


def AsyncClientPyroObject(pyro_synchronous_object: Pyro5.api.Proxy) -> _ACPO:
    """A Wrapper Class constructor to take a PyroSynchronousObject Proxy and make calls awaitable.

    The purpose of this class re-constructor is to create an object with all the attributes of a Proxy object
    that was created from a PyroSynchronousObject. The attributes which were originally async but were 'synchronized'
    by the PyroSynchronousObject constructor will be wrapped to be awaitable again. Standard method calls and
    property attributes will be forwarded as usual.

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
        dict(_build_classdict(pyro_synchronous_object)),
    )
    return AsyncCls()  # type: ignore


def _build_classdict(
    pso: Pyro5.api.Proxy,
) -> Iterator[tuple[str, Any]]:
    # ensures metadata is available
    pso._pyroBind()  # type: ignore
    async_methods: dict[str, dict[str, Any]] = _get_async_methods(pso)
    async_method_names = [method["__name__"] for method in async_methods.values()]
    # Attach PSO exposed methods to the AsyncClientPyroObject
    for method in pso._pyroMethods:
        attribute = getattr(pso, method)
        if method in async_method_names:
            # For methods that are awaitable wrap them as an async reference that forwards the call to the PSO Proxy.
            method_metadata: dict[str, Any] = async_methods[method]
            async_method = wrap_as_async(method_metadata)
            yield (method, async_method)
        else:
            # For standard method calls forward the direct call to the method on the PSO Proxy.
            yield (method, attribute)
    # Attach PSO exposed attributes to the AsyncClientPyroObject
    for attr in pso._pyroAttrs:
        # For property attributes we use to attach a wrapped `getattr` call for that attribute.
        # This is set as a new property of the AsyncClientPyroObject that forwards calls to the PSO Proxy.
        yield (
            attr,
            property(wrap_property(pso, attr)),
        )
    yield ("_proxy", pso)


### Helpers ###


def _get_async_methods(proxy: Pyro5.api.Proxy) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = getattr(proxy, "get_pyro_async_methods", {})
    return result


def wrap_as_async(method_metadata: dict[str, Any]) -> Any:
    """Wrapper to make a callable element on a PyroSynchronousObject into an awaitable element on a AsyncClientPyroObject."""

    async def wrapper(self: Any, *args: P.args, **kwargs: P.kwargs) -> Any:  # type: ignore
        def _thread_call(
            proxy: Pyro5.api.Proxy,
            func_name: str,
            *args: P.args,  # type: ignore
            **kwargs: P.kwargs,  # type: ignore
        ) -> Any:
            # This must be done because Pyro only accepts proxy calls from the thread that owns the proxy
            thread_proxy = Pyro5.api.Proxy(proxy._pyroUri)  # type: ignore
            func = getattr(thread_proxy, func_name)
            return func(*args, **kwargs)

        # Return a Coroutine that may be awaited, it will execute the `_thread_call` when called
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
    """Wrapper to produce a call forward to a specified attribute of a Proxy object."""
    return lambda self, current_attr=attr: getattr(proxy, current_attr)
