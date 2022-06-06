import asyncio
from typing import NoReturn

from aiohttp import web

from . import systemd


async def run_application(app: web.Application, host: str, port: int) -> NoReturn:
    """
    To document:

    * Never returns until the task is cancelled (process is shut down)
    * Unlike standard run(), useful if we need to do async stuff outside of the
      server
    * Rename to mention notifying up
    """
    runner = web.AppRunner(app)  # type: ignore[no-untyped-call]

    await runner.setup()  # type: ignore[no-untyped-call]

    try:
        site = web.TCPSite(  # type: ignore[no-untyped-call]
            runner=runner, host=host, port=port
        )
        await site.start()  # type: ignore[no-untyped-call]
        systemd.notify_up()
        while True:
            # It seems like there should be a better way of doing this,
            # but this is what the docs recommend.
            # https://docs.aiohttp.org/en/stable/web_advanced.html#application-runners
            await asyncio.sleep(3600)

    finally:
        await runner.cleanup()  # type: ignore[no-untyped-call]
