from typing_extensions import Protocol
from aiohttp import web


class Handler(Protocol):
    """The type signature of an aiohttp request handler function.

    Useful for typing function decorators that operate on aiohttp request handlers.
    """

    async def __call__(self, request: web.Request) -> web.Response:
        ...
