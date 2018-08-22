import asyncio
import os
import logging
from time import sleep
import aiohttp
from aiohttp import web
from threading import Thread

log = logging.getLogger(__name__)


def do_restart():
    """ This is the (somewhat) synchronous method to use to do a restart.

    It actually starts a thread that does the restart. `__wait_and_restart`,
    on the other hand, should not be called directly, because it will block
    until the system restarts.
    """
    Thread(target=__wait_and_restart).start()


def __wait_and_restart():
    """ Delay and then execute the restart. Do not call directly. Instead, call
    `do_restart()`.
    """
    log.info('Restarting server')
    sleep(1)
    # We can use the default event loop here because this
    # is actually running in a thread. We use aiohttp here because urllib is
    # painful and we don’t have `requests`.
    loop = asyncio.new_event_loop()
    loop.run_until_complete(_resin_supervisor_restart())


async def _resin_supervisor_restart():
    """ Execute a container restart by requesting it from the supervisor.

    Note that failures here are returned but most likely will not be
    sent back to the caller, since this is run in a separate workthread.
    If the system is not responding, look for these log messages.
    """
    supervisor = os.environ.get('RESIN_SUPERVISOR_ADDRESS',
                                'http://127.0.0.1:48484')
    restart_url = supervisor + '/v1/restart'
    api = os.environ.get('RESIN_SUPERVISOR_API_KEY', 'unknown')
    app_id = os.environ.get('RESIN_APP_ID', 'unknown')
    async with aiohttp.ClientSession() as session:
        async with session.post(restart_url,
                                params={'apikey': api},
                                json={'appId': app_id,
                                      'force': True}) as resp:
            body = await resp.read()
            if resp.status != 202:
                log.error("Could not shut down: {}: {}"
                          .format(resp.status, body))


async def restart(request):
    """
    Returns OK, then waits approximately 1 second and restarts container
    """
    do_restart()
    return web.json_response({"message": "restarting"})
