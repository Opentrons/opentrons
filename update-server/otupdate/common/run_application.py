import asyncio

import uvicorn
from fastapi import FastAPI

from . import systemd

_STARTUP_POLL_INTERVAL = 0.05


async def run_and_notify_up(app: FastAPI, host: str, port: int) -> None:
    """Run a FastAPI application.

    Once the application is up and running and serving requests,
    notify systemd that this service has completed its startup.

    This method will only return once the server has stopped,
    such as if this process has been signaled to stop.
    """
    server = uvicorn.Server(
        uvicorn.Config(
            app=app,
            host=host,
            port=port,
            # We've already configured logging ourselves, so stop uvicorn from
            # clobbering it with its own defaults.
            log_config=None,
            log_level=None,
        )
    )

    notifier = asyncio.create_task(_notify_once_serving(server))
    try:
        await server.serve()
    finally:
        notifier.cancel()


async def _notify_once_serving(server: uvicorn.Server) -> None:
    while not server.started:
        await asyncio.sleep(_STARTUP_POLL_INTERVAL)
    systemd.notify_up()
