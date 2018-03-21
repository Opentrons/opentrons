import os
import json
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


async def get_engaged_axes(request):
    """
    Query driver for engaged state by axis. Response keys will be axes XYZABC
    and keys will be True for engaged and False for disengaged. Axes must be
    manually disengaged, and are automatically re-engaged whenever a "move" or
    "home" command is called on that axis.

    Response shape example:
        {"x": {"enabled": true}, "y": {"enabled": false}, ...}
    """
    return web.json_response(
        {k.lower(): {'enabled': v}
         for k, v in robot._driver.engaged_axes.items()})


async def disengage_axes(request):
    """
    Disengage axes (turn off power) primarily in order to reduce heat
    consumption.
    :param request: Must contain an "axes" field with a list of axes
        to disengage (["x", "y", "z", "a", "b", "c"])
    :return: message and status code
    """
    data = await request.text()
    axes = json.loads(data).get('axes')
    invalid_axes = [ax for ax in axes if ax.lower() not in 'xyzabc']
    if invalid_axes:
        message = "Invalid axes: {}".format(invalid_axes)
        status = 400
    else:
        robot._driver.disengage_axis("".join(axes))
        message = "Disengaged axes: {}".format(axes)
        status = 200
    return web.json_response({"message": message}, status=status)


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
