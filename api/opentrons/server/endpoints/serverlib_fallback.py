# This file duplicates the implementation of ot2serverlib
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


async def install_py(data, loop):
    filename = data.filename
    log.info('Preparing to install: {}'.format(filename))
    content = data.file.read()

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

    filename = data.filename
    log.info('Flashing image "{}", this will take about 1 minute'.format(
        filename))
    content = data.file.read()

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
    and file fields in the body named "whl", "serverlib", and "fw". The "whl"
    and "serverlib" files should be valid Python wheels to be installed ("whl"
    is expected generally to be the API server wheel, and "serverlib" is
    expected to be the ot2serverlib wheel. The "fw" file is expected to be a
    Smoothie firmware hex file. The Python files are install using pip, and the
    firmware file is flashed to the Smoothie board, then the files are deleted
    and a success code is returned.
    """
    log.debug('Update request received')
    data = await request.post()
    try:
        res0 = await install_py(
            data['whl'], request.loop)
        reslist = [res0]
        if 'serverlib' in data.keys():
            res1 = await install_py(
                data['serverlib'], request.loop)
            reslist.append(res1)
        if 'fw' in data.keys():
            res2 = await install_smoothie_firmware(
                data['fw'], request.loop)
            reslist.append(res2)
        res = {
            'message': [r['message'] for r in reslist],
            'filename': [r['filename'] for r in reslist]
        }
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
        res = await install_smoothie_firmware(data['hex'], request.loop)
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
