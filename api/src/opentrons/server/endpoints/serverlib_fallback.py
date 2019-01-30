# This file duplicates the implementation of ot2serverlib. Remove once all
# robots have new update endpoints
import os
import json
import asyncio
import logging
from time import sleep
from aiohttp import web
from threading import Thread
from typing import Dict, Any

from opentrons import robot, config

log = logging.getLogger(__name__)
ignore_file = 'ignore.json'
if config.IS_ROBOT:
    filedir = '/data/user_storage/opentrons_data'
else:
    filedir = os.path.abspath(os.path.dirname(__file__))
filepath = os.path.join(filedir, ignore_file)


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
    filename = data.filename
    log.info('Flashing image "{}", this will take about 1 minute'.format(
        filename))
    content = data.file.read()

    with open(filename, 'wb') as wf:
        wf.write(content)

    msg = await robot.update_firmware(filename, loop)
    log.info('Firmware Update complete: {}'.format(msg))
    try:
        os.remove(filename)
    except OSError:
        pass
    return {'message': msg, 'filename': filename}


def _set_ignored_version(version):
    """
    Private helper function that writes the most updated
    API version that was ignored by a user in the app
    :param version: Most recent ignored API update
    """
    data = {'version': version}
    with open(filepath, 'w') as data_file:
        json.dump(data, data_file)


def _get_ignored_version():
    """
    :return: Most recently ignored API version
    """
    if os.path.exists(filepath):
        with open(filepath) as data_file:
            data = json.load(data_file)
            version = data.get('version')
    else:
        version = None
    return version


async def get_ignore_version(request):
    """
    This handler returns a GET request of form application/json.

    The return body will be formatted as:
    {"version": version_ignored}

    If no version has been previously ignored, the value will be null
    """
    ignored_version = _get_ignored_version()
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
            _set_ignored_version(ignored_version)
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
        res: Dict[str, Any] = {
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
        res = await install_smoothie_firmware(data['hex'], request.loop)
        status = 200
    except Exception as e:
        log.exception("Exception during firmware update:")
        res = {'message': 'Exception {} raised by update of {}: {}'.format(
                type(e), data, e.__traceback__)}
        status = 500
    return web.json_response(res, status=status)


async def restart(request):
    """
    Returns OK, then waits approximately 1 second and restarts container
    """
    def wait_and_restart():
        log.info('Restarting server')
        sleep(1)
        os.system('kill 1')
    Thread(target=wait_and_restart).start()
    return web.json_response({"message": "restarting"})
