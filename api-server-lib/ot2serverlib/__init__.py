import os
import logging
import asyncio

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
