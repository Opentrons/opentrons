"""Class wrapper that ingests a PyroSynchronousObject and maps 'synchronized' async functions to awaitable methods."""

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
    async_methods = _get_async_methods(pso)
    # Attach PSO exposed methods to the AsyncClientPyroObject
    for method in pso._pyroMethods:
        attribute = getattr(pso, method)
        if method in async_methods:
            # For methods that are awaitable wrap them as an async reference that forwards the call to the PSO Proxy.
            async_method = wrap_as_async(attribute)
            yield (method, async_method)
        else:
            # For standard method calls forward the direct call to the method on the PSO Proxy.
            yield (method, attribute)
    # Attach PSO exposed attributes to the AsyncClientPyroObject
    for attr in pso._pyroAttrs:
        # For property attributes we use a lambda function to attach a `getattr` call for that attribute.
        # This is set as a new property of the AsyncClientPyroObject that forwards calls to the PSO Proxy.
        client_property: Any = lambda self, current_attr=attr: getattr(
            pso, current_attr
        )
        yield (
            attr,
            property(client_property),
        )


### Helpers ###


def _get_async_methods(proxy: Pyro5.api.Proxy) -> list[str]:
    try:
        result: list[str] = getattr(proxy, "get_pyro_async_methods")
        return result
    except Exception as e:
        return []


def wrap_as_async(func: Any) -> Any:
    """Wrapper to make a callable element on a PyroSynchronousObject into an awaitable element on a AsyncClientPyroObject."""

    async def wrapper(self, *args: P.args, **kwargs: P.kwargs) -> Any:  # type: ignore
        # Forward the call to the Proxy function, catching the `self` of the AsyncClientPyroObject
        return func(*args, **kwargs)

    return wrapper
