import os
import logging
import asyncio
from zipfile import ZipFile
from aiohttp import web

from opentrons import robot
from opentrons import config
from opentrons.config import feature_flags as ff

log = logging.getLogger(__name__)


async def _install(filename, loop):
    proc = await asyncio.create_subprocess_shell(
        'pip install --upgrade --force-reinstall --no-deps {}'.format(
            filename),
        stdout=asyncio.subprocess.PIPE,
        loop=loop)

    rd = await proc.stdout.read()
    res = rd.decode().strip()
    print(res)
    await proc.wait()
    return res


async def _update_firmware(filename, loop):
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


async def install_api(request):
    """
    This handler accepts a POST request with Content-Type: multipart/form-data
    and a file field in the body named "whl". The file should be a valid Python
    wheel to be installed. The received file is install using pip, and then
    deleted and a success code is returned.
    """
    log.debug('Update request received')
    data = await request.post()
    try:
        filename = data['whl'].filename
        log.info('Preparing to install: {}'.format(filename))
        content = data['whl'].file.read()

        with open(filename, 'wb') as wf:
            wf.write(content)

        msg = await _install(filename, request.loop)
        log.debug('Install complete')
        try:
            os.remove(filename)
        except OSError:
            pass
        log.debug("Result: {}".format(msg))
        res = web.json_response({
            'message': msg,
            'filename': filename})
    except Exception as e:
        res = web.json_response(
            {'error': 'Exception {} raised by update of {}. Trace: {}'.format(
                type(e), data, e.__traceback__)},
            status=500)
    return res


async def update_firmware(request):
    """
    This handler accepts a POST request with Content-Type: multipart/form-data
    and a file field in the body named "hex". The file should be a valid HEX
    image to be flashed to the LPC1769. The received file is flashed using
    lpc21isp, and then deleted and a success code is returned.
    """
    log.debug('Update Firmware request received')
    data = await request.post()
    try:
        filename = data['hex'].filename
        log.info('Flashing image "{}", this will take about 1 minute'.format(
            filename))
        content = data['hex'].file.read()

        with open(filename, 'wb') as wf:
            wf.write(content)

        msg = await _update_firmware(filename, request.loop)
        log.debug('Firmware Update complete')
        try:
            os.remove(filename)
        except OSError:
            pass
        log.debug("Result: {}".format(msg))
        res = web.json_response({
            'message': msg,
            'filename': filename})
    except Exception as e:
        res = web.json_response(
            {'error': 'Exception {} raised by update of {}. Trace: {}'.format(
                type(e), data, e.__traceback__)},
            status=500)
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
