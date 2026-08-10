"""Pyro utilities for identifying a Proxy on a Nameserver."""

import asyncio
import time
from typing import Any, Optional

import Pyro5.api

from opentrons.util.pyro.pyro_client_async_adapter import _ACPO, AsyncClientPyroObject

_RUN_PROXY_TIMEOUT = 30  # seconds


def wait_for_proxy(
    proxy_name: str, broadcast_mode: Optional[bool] = False
) -> Optional[_ACPO]:
    """Attempt to identify a Proxy of a given name on the Nameserver, returning an Asynchronous Client Pyro Object on success.

    Parameters:
    - proxy_name: Resource name to search for on the Nameserver
    - broadcast_mode: Whether or not to search for the Nameserver in broadcast mode, defaults to False limiting search to localhost.
    """

    async def _poll_nameserver(ns: Any, proxy_name: str) -> Optional[_ACPO]:
        if proxy_name in ns.list():
            async_proxy = AsyncClientPyroObject(
                Pyro5.api.Proxy(ns.list()[proxy_name])  # type: ignore[no-untyped-call]
            )
            return async_proxy
        await asyncio.sleep(0.01)
        return None

    start_time = time.monotonic()
    with Pyro5.api.locate_ns(broadcast=broadcast_mode if broadcast_mode is not None else False) as ns:
        while time.monotonic() - start_time < _RUN_PROXY_TIMEOUT:
            # Poll the Nameserver for the duration of the timeout until proxy found
            result = asyncio.run_coroutine_threadsafe(
                coro=_poll_nameserver(ns, proxy_name), loop=asyncio.get_event_loop()
            ).result()
            if result is not None:
                return result
    return None
