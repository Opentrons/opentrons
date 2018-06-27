import os
import logging
from time import sleep
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


def __wait_and_restart():
    log.info('Restarting server')
    sleep(1)
    os.system('kill 1')


async def get_logs(request):
    """
    This handler accepts a GET request and returns a blob with
    Content-Type: multipart/form-data.
    """
    path = 'data/user_storage/opentrons_data/logs/'
    file1 = os.path.join(path, 'api.log')
    file2 = os.path.join(path, 'serial.log')
    logs = {'apiLog': open(file1, 'rb'), 'serialLog': open(file2, 'rb')}
    # data = await request.text()
    # packet1 = data['serial']
    # packet2 = data['api']
    # filename = packet1.filename
    # content = packet1.file.read()

    # with open(filename, 'wb') as f:
    #     f.write(content)

    res = {}
    status = 200

    return web.json_response(
        content_type='multipart/form-data', data=logs, status=status
    )


async def restart(request):
    """
    Returns OK, then waits approximately 1 second and restarts container
    """
    Thread(target=__wait_and_restart).start()
    return web.json_response({"message": "restarting"})
