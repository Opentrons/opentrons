import os
import asyncio
import logging
from time import sleep
from aiohttp import web
from threading import Thread

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


async def install_api(data, loop):
    filename = data['whl'].filename
    log.info('Preparing to install: {}'.format(filename))
    content = data['whl'].file.read()

    with open(filename, 'wb') as wf:
        wf.write(content)

    msg = await _install(filename, loop)
    log.debug('Install complete')
    try:
        os.remove(filename)
    except OSError:
        pass
    log.debug("Result: {}".format(msg))
    return {'message': msg, 'filename': filename}


async def install_smoothie_firmware(data, loop):
    from opentrons.server.endpoints.update import _update_firmware

    filename = data['hex'].filename
    log.info('Flashing image "{}", this will take about 1 minute'.format(
        filename))
    content = data['hex'].file.read()

    with open(filename, 'wb') as wf:
        wf.write(content)

    msg = await _update_firmware(filename, loop)
    log.debug('Firmware Update complete')
    try:
        os.remove(filename)
    except OSError:
        pass
    log.debug("Result: {}".format(msg))
    return {'message': msg, 'filename': filename}


async def update_api(request: web.Request) -> web.Response:
    """
    This handler accepts a POST request with Content-Type: multipart/form-data
    and a file field in the body named "whl". The file should be a valid Python
    wheel to be installed. The received file is install using pip, and then
    deleted and a success code is returned.
    """
    log.debug('Update request received')
    data = await request.post()
    try:
        res = await install_api(data, request.loop)
        status = 200
    except Exception as e:
        res = {'error': 'Exception {} raised by update of {}: {}'.format(
                type(e), data, e.__traceback__)}
        status = 500
    return web.json_response(res, status=status)


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
        res = await install_smoothie_firmware(data, request.loop)
        status = 200
    except Exception as e:
        log.exception("Exception during firmware update:")
        res = {'error': 'Exception {} raised by update of {}: {}'.format(
                type(e), data, e.__traceback__)}
        status = 500
    return web.json_response(res, status=status)


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
