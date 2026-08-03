"""An HTTP client for exercising the server in-process."""

from __future__ import annotations

import httpx
from fastapi import FastAPI


class UpdateServerClient(httpx.AsyncClient):
    """An httpx client that talks to an update-server app over ASGI.

    The app runs in the test's own event loop, so background tasks that the
    server kicks off keep making progress between requests.

    `asgi_app` is exposed so tests can inspect global app state.
    """

    def __init__(self, app: FastAPI) -> None:
        super().__init__(
            transport=httpx.ASGITransport(app=app),
            base_url="http://update-server.test",
        )
        self.asgi_app = app
