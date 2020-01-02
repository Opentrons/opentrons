import os
import sys
import shutil
import asyncio
import logging
import re
import traceback
from aiohttp import web

log = logging.getLogger(__name__)
VENV_NAME = 'env'

# This regex should match a PEP427 compliant wheel filename and extract its
# version into separate groups. Groups 1, 2, 3, and 4 should be the major,
# minor, patch, and tag respectively. The tag capture group is optional
WHEEL_VERSION_RE = re.compile(r'^[\w]+-([\d]+).([\d]+).([\d]+)([\w.]+)?-.*\.whl') # noqa
FIRST_PROVISIONED_VERSION = (3, 3, 0)


def _version_less(version_a, version_b):
    """ Takes two version as (major, minor, patch) tuples and returns a <= b.
    """
    if version_a[0] > version_b[0]:
        return False
    elif version_a[0] < version_b[0]:
        return True
    else:
        if version_a[1] > version_b[1]:
            return False
        elif version_a[1] < version_b[1]:
            return True
        else:
            return version_a[2] < version_b[2]


async def _install(python, filename, loop):
    running_on_pi = os.environ.get('RUNNING_ON_PI') and '/tmp' in python
    python_home = python.split(VENV_NAME)[0] + VENV_NAME

    if running_on_pi:
        env_vars = 'PYTHONHOME={} '.format(python_home)
    else:
        env_vars = ''

    pip_opts = '--upgrade --force-reinstall --no-deps'
    command = '{}{} -m pip install {} {}'.format(
        env_vars, python, pip_opts, filename)

    log.debug('cmd: {}'.format(command))
    proc = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        loop=loop)

    rd_out = await proc.stdout.read()
    rd_err = await proc.stderr.read()
    out = rd_out.decode().strip()
    err = rd_err.decode().strip()
    log.debug("Out: {}".format(out))
    log.debug("Err: {}".format(err))
    await proc.communicate()
    rc = proc.returncode

    if running_on_pi:
        # For some reason, the pip install above (using a python binary at
        # "/tmp/tmp<hash>/env/bin/python" causes the package to be installed
        # in "/data/packages/tmp/tmp<hash>/env/lib/python3.6/site-packages",
        # so it is not found unless it is subsequently copied into the same
        # path without the preceeding "/data/packages". Note that for the join
        # to work correctly, the leading '/' has to be dropped from
        # `python_home`. This whole difficulty is a side-effect of not calling
        # the `activate` script of the virtual environment, but if the activate
        # script is called in a subprocess then the server must be started in
        # the same shell and we lose the reference to the server (the
        # subprocess ends up pointing to the activate shell and killing it does
        # not halt the server.
        src_spk = os.path.join(
            '/data/packages',
            python_home[1:],
            'lib',
            'python3.6',
            'site-packages')
        dst_spk = os.path.join(python_home, 'lib', 'python3.6')
        dst_packages = os.listdir(dst_spk)
        for pkg in os.listdir(src_spk):
            if pkg not in dst_packages:
                src = os.path.join(src_spk, pkg)
                dst = os.path.join(dst_spk, pkg)
                log.debug("Moving {} to {}".format(src, dst))
                shutil.move(src, dst)
    return out, err, rc


async def _update_firmware(filename, loop):
    """
    Currently uses the robot singleton from the API server to connect to
    Smoothie. Those calls should be separated out from the singleton so it can
    be used directly without requiring a full initialization of the API robot.
    """
    try:
        from opentrons import robot
    except ModuleNotFoundError:
        res = "Unable to find module `opentrons`--not updating firmware"
        rc = 1
        log.error(res)
    else:
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
        await proc.communicate()
        rc = proc.returncode

        if rc == 0:
            # re-open the port
            robot._driver._connection.open()
            # reset smoothieware
            robot._driver._smoothie_reset()
            # run setup gcodes
            robot._driver._setup()

    return res, rc


async def install_smoothie_firmware(data, loop):
    filename = data.filename
    log.info('Flashing image "{}", this will take about 1 minute'.format(
        filename))
    content = data.file.read()

    with open(filename, 'wb') as wf:
        wf.write(content)

    msg, returncode = await _update_firmware(filename, loop)
    log.debug('Firmware Update complete')
    try:
        os.remove(filename)
    except OSError:
        pass
    log.debug("Result: {}".format(msg))
    return {'message': msg, 'filename': filename}, returncode


async def install_py(python, data, loop):
    filename = data.filename
    log.info('Preparing to install: {}'.format(filename))
    content = data.file.read()

    with open(filename, 'wb') as wf:
        wf.write(content)

    out, err, returncode = await _install(python, filename, loop)
    if returncode == 0:
        msg = out
    else:
        msg = err
    log.debug('Install complete. Result [rc {}]: {}'.format(returncode, msg))
    try:
        os.remove(filename)
    except OSError:
        pass
    log.debug("Result: {}".format(msg))
    return {'message': msg, 'filename': filename}, returncode


async def _provision_container(python, loop):
    if not os.environ.get('RUNNING_ON_PI'):
        return {'message': 'Did not provision (not on pi)',
                'filename': '<provision>'}, 0
    provision_command = 'provision-api-resources'
    proc = await asyncio.create_subprocess_shell(
        provision_command, stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE, loop=loop)
    sub_stdout = await proc.stdout.read()
    sub_stderr = await proc.stderr.read()
    await proc.communicate()
    rc = proc.returncode
    if rc != 0:
        res = sub_stderr.decode().strip()
    else:
        res = sub_stdout.decode().strip()
    return {'message': res, 'filename': '<provision>'}, rc


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
        res0, rc0 = await install_py(
            sys.executable, data['whl'], request.loop)
        reslist = [res0]
        filename = os.path.basename(res0['filename'])
        version_re_res = re.search(WHEEL_VERSION_RE, filename)
        rcprov = 0
        if not version_re_res:
            log.warning("Wheel version regex didn't match {}: won't provision"
                        .format(filename))
        elif rc0 == 0:
            v_maj, v_min, v_pat\
                = (int(v) for v in version_re_res.group(1, 2, 3))
            if not _version_less((v_maj, v_min, v_pat),
                                 FIRST_PROVISIONED_VERSION):
                resprov, rcprov = await _provision_container(
                    sys.executable, request.loop)
                reslist.append(resprov)
        if 'serverlib' in data.keys():
            res1, rc1 = await install_py(
                sys.executable, data['serverlib'], request.loop)
            reslist.append(res1)
        else:
            rc1 = 0
        if 'fw' in data.keys():
            res2, rc2 = await install_smoothie_firmware(
                data['fw'], request.loop)
            reslist.append(res2)
        else:
            rc2 = 0
        res = {
            'message': [r['message'] for r in reslist],
            'filename': [r['filename'] for r in reslist]
        }
        returncode = rc0 + rc1 + rc2 + rcprov
        if returncode == 0:
            status = 200
        else:
            status = 400
    except Exception as e:
        res = {'message':  # type: ignore
               'Exception {} raised by update of {}: {}'
               .format(type(e), data, traceback.format_tb(e.__traceback__))}
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
        res, returncode = await install_smoothie_firmware(
            data['hex'], request.loop)
        if returncode == 0:
            status = 200
        else:
            status = 400
    except Exception as e:
        log.exception("Exception during firmware update:")
        res = {'message': 'Exception {} raised by update of {}: {}'.format(
                type(e), data, e.__traceback__)}
        status = 500
    return web.json_response(res, status=status)
