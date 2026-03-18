"""Class wrapper that ingests a PyroSynchronousObject and maps "synchronized" async functions to awaitable methods."""

from typing import Any, Iterator, ParamSpec, TypeVar

import Pyro5.api

T = TypeVar("T")
P = ParamSpec("P")


class _ACPO:
    pass


def AsyncClientPyroObject(pyro_synchronous_object: Pyro5.api.Proxy) -> _ACPO:
    """*Async Client Wrapper Description Here*"""
    AsyncCls = type(
        f"AsyncClientPyroObject_{pyro_synchronous_object.__class__.__name__}_{id(pyro_synchronous_object)}",
        (_ACPO,),
        dict(_build_classdict(pyro_synchronous_object)),
    )
    return AsyncCls()  # type: ignore


def _build_classdict(
    pso: Pyro5.api.Proxy,
) -> Iterator[tuple[str, Any]]:
    pso._pyroBind()  # ensures metadata is available
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
        yield (
            attr,
            property(lambda self, current_attr=attr: getattr(pso, current_attr)),
        )


### Helpers ###


def _get_async_methods(proxy: Pyro5.api.Proxy) -> list[str]:
    try:
        return getattr(proxy, "get_pyro_async_methods")
    except Exception as e:
        return []


def wrap_as_async(func: Any) -> Any:
    """Wrapper to make a callable element on a PyroSynchrnousObject into an awaitable element on the wrapped object instance."""

    async def wrapper(self, *args: P.args, **kwargs: P.kwargs) -> Any:
        return func(*args, **kwargs)

    return wrapper
