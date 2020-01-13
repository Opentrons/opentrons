import logging
import asyncio
import tempfile
from aiohttp import web

from ..util import http_version
from opentrons.hardware_control import modules


log = logging.getLogger(__name__)
UPDATE_TIMEOUT = 15


# TODO: (BC, 2019-10-24): once APIv1 server ff toggle is gone,
#  this should be removed
@http_version(0, 0)
async def cannot_update_firmware(request: web.Request) -> web.Response:
    """
     This handler refuses a module firmware update request
     in the case that the API server isn't equipped to handle it.
    """
    log.debug('Cannot update module firmware on this server version')
    status = 501
    res = {'message': 'Cannot update module firmware \
                        via APIv1 server, please update server to APIv2'}
    return web.json_response(res, status=status)


@http_version(0, 0)
async def update_module_firmware(request: web.Request) -> web.Response:
    """
     This handler accepts a POST request with Content-Type: multipart/form-data
     and a file field in the body named "module_firmware". The file should
     be a valid HEX/binary image to be flashed to the module. The received
     file is sent via USB to the board and flashed by the bootloader.
     The file is then deleted and a success code is returned
    """
    log.debug('Update Firmware request received')
    data = await request.post()
    module_serial = request.match_info['serial']
    fw_filename = data['module_firmware'].filename
    message = 'Server failed to update module firmware'
    status = 500

    log.info('Preparing to flash firmware image {}'.format(fw_filename))
    content = data['module_firmware'].file.read()
    with tempfile.NamedTemporaryFile(suffix=fw_filename) as fp:
        fp.write(content)
        message, status = await _upload_to_module(
            request.app['com.opentrons.hardware'],
            module_serial,
            fp.name,
            loop=request.loop)
        log.info('Firmware update complete')

    res = {'filename': fw_filename, 'message': message}
    return web.json_response(res, status=status)


async def _upload_to_module(hw, serialnum, fw_filename, loop):
    hw_mods = hw.attached_modules
    for module in hw_mods:
        if module.device_info.get('serial') == serialnum:
            log.info("Module with serial {} found".format(serialnum))
            try:
                await asyncio.wait_for(
                    modules.update_firmware(module, fw_filename, loop),
                    UPDATE_TIMEOUT)
                return f'Successully updated module {serialnum}', 200
            except modules.UpdateError as e:
                return f'Bootloader error: {e}', 400
            except asyncio.TimeoutError:
                return 'Bootloader not responding', 500
            break
    return f'Module {serialnum} not found', 404
