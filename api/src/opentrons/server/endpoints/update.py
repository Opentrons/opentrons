import logging
import asyncio
import tempfile
from aiohttp import web
from opentrons.config import feature_flags as ff
from opentrons.hardware_control import modules
try:
    from opentrons import modules as legacy_modules
except ImportError:
    pass


log = logging.getLogger(__name__)
UPDATE_TIMEOUT = 15


async def update_module_firmware(request):
    """
     This handler accepts a POST request with Content-Type: multipart/form-data
     and a file field in the body named "module_firmware". The file should
     be a valid HEX image to be flashed to the atmega32u4. The received file is
     sent via USB to the board and flashed by the avr109 bootloader. The file
     is then deleted and a success code is returned
    """
    log.debug('Update Firmware request received')
    data = await request.post()
    module_serial = request.match_info['serial']

    res = await _update_module_firmware(request.app['com.opentrons.hardware'],
                                        module_serial,
                                        data['module_firmware'],
                                        request.loop)
    if 'successful' not in res['message']:
        if 'bootloaderResponse' in res and \
           'checksum mismatch' in res['bootloaderResponse']:
            status = 400
        elif 'not found' in res['message']:
            status = 404
        else:
            status = 500
        log.error(res)
    else:
        status = 200
        log.info(res)
    return web.json_response(res, status=status)


async def _update_module_firmware(hw, module_serial, data, loop=None):
    fw_filename = data.filename
    content = data.file.read()
    log.info('Preparing to flash firmware image {}'.format(fw_filename))

    with tempfile.NamedTemporaryFile(suffix=fw_filename) as fp:
        fp.write(content)
        # returns a dict of 'message' & 'bootloaderResponse' or
        res = await _upload_to_module(hw, module_serial, fp.name, loop=loop)
    log.info('Firmware update complete')
    res['filename'] = fw_filename
    return res


async def _upload_to_module(hw, serialnum, fw_filename, loop):
    """
    This method remains in the API currently because of its use of the robot
    singleton's copy of the api object & driver. This should move to the server
    lib project eventually and use its own driver object (preferably involving
    moving the drivers themselves to the serverlib)
    """

    if not ff.use_protocol_api_v2():
        # ensure there is a reference to the port
        if not hw.is_connected():
            hw.connect()

    hw.discover_modules()
    hw_mods = hw.attached_modules.values()
    res = {}
    for module in hw_mods:
        if module.device_info.get('serial') == serialnum:

            # NOTE: legacy block, api_v2 enter bootloader is nested in
            # modules.update_firmware
            if not ff.use_protocol_api_v2():
                log.info("Module with serial {} found".format(serialnum))
                bootloader_port = await legacy_modules.enter_bootloader(module)
                if bootloader_port:
                    module._port = bootloader_port
                # else assume old bootloader connection on existing module port
                log.info("Uploading file to port: {}".format(
                    module.port))
                log.info("Flashing firmware. This will take a few seconds")

                try:
                    res = await asyncio.wait_for(
                        legacy_modules.update_firmware(
                            module, fw_filename, loop),
                        UPDATE_TIMEOUT)
                except asyncio.TimeoutError:
                    return {'message': 'AVRDUDE not responding'}
                break
            else:
                try:
                    updated_instance = await asyncio.wait_for(
                        modules.update_firmware(module, fw_filename, loop),
                        UPDATE_TIMEOUT)
                    if updated_instance:
                        res['message'] = f'Sucessfully updated firmware for module {serialnum}'

                except asyncio.TimeoutError:
                    return {'message': 'AVRDUDE not responding'}
                break
        if not res:
            res = {'message': 'Module {} not found'.format(serialnum)}

    return res
