import os
import logging
from time import sleep
from aiohttp import web
from threading import Thread

log = logging.getLogger(__name__)


def __wait_and_restart():
    log.info('Restarting server')
    sleep(1)
    os.system('kill 1')


async def restart(request):
    """
    Returns OK, then waits approximately 1 second and restarts container
    """
    Thread(target=__wait_and_restart).start()
    return web.json_response({"message": "restarting"})
