import asyncio
from typing import NoReturn

from aiohttp import web

from . import systemd


async def run_and_notify_up(app: web.Application, host: str, port: int) -> NoReturn:
    """Run an aiohttp application.

    Once the application is up and running and serving requests,
    notify systemd that this service has completed its startup.

    This method will only return once the task has been canceled,
    such as if this process has been signaled to stop.
    """
    runner = web.AppRunner(app)

    await runner.setup()

    try:
        site = web.TCPSite(runner=runner, host=host, port=port)
        await site.start()

        systemd.notify_up()

        while True:
            # It seems like there should be a better way of doing this,
            # but this is what the docs recommend.
            # https://docs.aiohttp.org/en/stable/web_advanced.html#application-runners
            await asyncio.sleep(10)

    finally:
        await runner.cleanup()
