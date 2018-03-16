import os
import logging
from time import sleep
from aiohttp import web
from threading import Thread
from opentrons import robot

log = logging.getLogger(__name__)


async def get_attached_pipettes(request):
    """
    Query robot for model strings on 'left' and 'right' mounts, and return a
    dict with the results keyed by mount

    Example:

    ```
    {
      'left': {
        'model': 'p300_single'
      },
      'right': {
        'model': 'p10_multi'
      }
    }
    ```

    If a pipette is "uncommissioned" (e.g.: does not have a model string
    written to on-board memory), or if no pipette is present, the corresponding
    mount will report `'model': 'uncommissioned'`
    """
    return web.json_response(robot.get_attached_pipettes())


async def identify(request):
    Thread(target=lambda: robot.identify(
        int(request.query.get('seconds', '10')))).start()
    return web.json_response({"message": "identifying"})


async def turn_on_rail_lights(request):
    robot.turn_on_rail_lights()
    return web.json_response({"lights": "on"})


async def turn_off_rail_lights(request):
    robot.turn_off_rail_lights()
    return web.json_response({"lights": "off"})


async def restart(request):
    """
    Returns OK, then waits approximately 3 seconds and restarts container
    """
    def wait_and_restart():
        log.info('Restarting server')
        sleep(3)
        os.system('kill 1')
    Thread(target=wait_and_restart).start()
    return web.json_response({"message": "restarting"})
