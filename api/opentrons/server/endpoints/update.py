import os
import logging
import asyncio
from aiohttp import web

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
    from opentrons import robot
    robot.connect()
    driver = robot._driver
    port = str(driver._connection.port)  # get port name
    driver._connection.close()
    driver._smoothie_programming_mode()

    # run lpc21isp, THIS WILL AROUND 1 MINUTE TO COMPLETE
    update_cmd = 'lpc21isp -wipe -donotstart {0} {1} {2} 12000'.format(
        filename, port, robot.config.serial_speed)
    proc = await asyncio.create_subprocess_shell(
        update_cmd,
        stdout=asyncio.subprocess.PIPE,
        loop=loop)
    rd = await proc.stdout.read()
    res = rd.decode().strip()
    await proc.wait()

    # reconnect to port
    driver._connection.open()
    driver._smoothie_reset()
    driver._setup()

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
