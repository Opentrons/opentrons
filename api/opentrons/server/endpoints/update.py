import os
import logging
import asyncio
from aiohttp import web
from opentrons.config import feature_flags as ff
from opentrons import robot

log = logging.getLogger(__name__)


async def _update_firmware(filename, loop):
    """
    This method remains in the API currently because of its use of the robot
    singleton's copy of the driver. This should move to the server lib project
    eventually and use its own driver object (preferably involving moving the
    drivers themselves to the serverlib)
    """
    # ensure there is a reference to the port
    if not robot.is_connected():
        robot.connect()

    # get port name
    port = str(robot._driver.port)
    # set smoothieware into programming mode
    robot._driver._smoothie_programming_mode()
    # close the port so other application can access it
    robot._driver._connection.close()

    # run lpc21isp, THIS WILL TAKE AROUND 1 MINUTE TO COMPLETE
    update_cmd = 'lpc21isp -wipe -donotstart {0} {1} {2} 12000'.format(
        filename, port, robot.config.serial_speed)
    proc = await asyncio.create_subprocess_shell(
        update_cmd,
        stdout=asyncio.subprocess.PIPE,
        loop=loop)
    rd = await proc.stdout.read()
    res = rd.decode().strip()
    await proc.wait()

    # re-open the port
    robot._driver._connection.open()
    # reset smoothieware
    robot._driver._smoothie_reset()
    # run setup gcodes
    robot._driver._setup()

    return res


async def set_feature_flag(request):
    """
    Post body must include the keys 'key' and 'value'. The values of these two
    entries will be set in the settings file as a key-value pair.
    """
    try:
        data = await request.json()
        flag_name = data.get('key')
        flag_value = data.get('value')
        log.debug("Set feature flag '{}' to '{}' (prior value: '{}')".format(
            flag_name, flag_value, ff.get_feature_flag(flag_name)))

        ff.set_feature_flag(flag_name, flag_value)

        message = "Set '{}' to '{}'".format(flag_name, flag_value)
        status = 200
    except Exception as e:
        message = 'Error: {}'.format(e)
        status = 400
    return web.json_response({'message': message}, status=status)


async def get_feature_flag(request):
    """
    URI path should specify the {flag} match parameter. The 'all' flag is
    reserved to return the dict of all managed settings.
    """
    res = ff.get_all_feature_flags()
    return web.json_response(res)


async def environment(request):
    res = dict(os.environ)
    api_keys = filter(lambda x: "KEY" in x, list(res.keys()))
    for key in api_keys:
        res.pop(key)
    return web.json_response(res)
