from typing import Awaitable, Callable, TypeAlias

from aiohttp import web

Handler: TypeAlias = Callable[[web.Request], Awaitable[web.StreamResponse]]
"""The type signature of an aiohttp request handler function.

Useful for typing function decorators that operate on aiohttp request handlers.
"""
