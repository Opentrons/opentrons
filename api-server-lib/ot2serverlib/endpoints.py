import asyncio
import os
import logging
from time import sleep
import aiohttp
from aiohttp import web
from threading import Thread
import ot2serverlib
from ot2serverlib import ignore_update

log = logging.getLogger(__name__)


async def get_ignore_version(request):
    """
    This handler returns a GET request of form application/json.

    The return body will be formatted as:
    {"version": version_ignored}

    If no version has been previously ignored, the value will be null
    """
    ignored_version = ignore_update._get_ignored_version()
    res = {'version': ignored_version}
    return web.json_response(res)


async def set_ignore_version(request):
    """
    This handler expects a POST request of form application/json.

    The request body should be formatted as:
    {"version": version_ignored}

    The POST will 400 in the following scenarios:
    1. Sending an empty dict
    2. Sending a dict with an empty string
    """
    data = await request.json()
    if 'version' in data.keys():
        ignored_version = data.get('version')
        log.debug('Set Ignore Version to {}'.format(ignored_version))
        if ignored_version == '':
            status = 400
            res = {'version': None}
        else:
            ignore_update._set_ignored_version(ignored_version)
            status = 200
            res = {'version': ignored_version}
    else:
        status = 400
        res = {'version': None}

    return web.json_response(res, status=status)


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
        res0 = await ot2serverlib.install_py(
            data['whl'], request.loop)
        reslist = [res0]
        if 'serverlib' in data.keys():
            res1 = await ot2serverlib.install_py(
                data['serverlib'], request.loop)
            reslist.append(res1)
        if 'fw' in data.keys():
            res2 = await ot2serverlib.install_smoothie_firmware(
                data['fw'], request.loop)
            reslist.append(res2)
        res = {
            'message': [r['message'] for r in reslist],
            'filename': [r['filename'] for r in reslist]
        }
        status = 200
    except Exception as e:
        res = {'message': 'Exception {} raised by update of {}: {}'.format(
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
        res = await ot2serverlib.install_smoothie_firmware(
            data['hex'], request.loop)
        status = 200
    except Exception as e:
        log.exception("Exception during firmware update:")
        res = {'message': 'Exception {} raised by update of {}: {}'.format(
                type(e), data, e.__traceback__)}
        status = 500
    return web.json_response(res, status=status)


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
