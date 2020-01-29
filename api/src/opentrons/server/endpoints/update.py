import logging
import asyncio
import tempfile
from aiohttp.web import json_response
from opentrons.hardware_control import modules


log = logging.getLogger(__name__)
UPDATE_TIMEOUT = 30


# TODO: (BC, 2019-10-24): once APIv1 server ff toggle is gone,
#  this should be removed
async def cannot_update_firmware(request):
    """
    This handler refuses a module firmware update request
    in the case that the API server isn't equipped to handle it.
    """
    log.debug('Cannot update module firmware on this server version')
    status = 501
    res = {'message': ('Cannot update module firmware'
                       'via APIv1 server, please update server to APIv2')}
    return json_response(res, status=status)


async def update_module_firmware(request):
    """
    This handler accepts a POST request and initiates a firmware
    update on the attached module specified by its serial number in the
    query string. The update process attempts to bootload the firmware
    file for the matching module type that is present in the file system
    onto the specified attached module.

    On update success:
    # status 200

    On bootloader error:
    # status 404

    On bootloader not responding:
    # status 500

    On module or bundled firmware file not found:
    # status 404
    """
    log.debug('Update Module Firmware request received')
    serial = request.match_info['serial']

    for module in request.app['com.opentrons.hardware'].attached_modules:
        if module.device_info.get('serial') == serial:
            log.info("Module with serial {} found".format(serial))
            try:
                if module.bundled_fw:
                    await asyncio.wait_for(
                        modules.update_firmware(
                            module, module.bundled_fw.path, request.loop),
                        UPDATE_TIMEOUT)
                    return json_response({'message': ('Successully updated'
                                                      f' module {serial}'),
                                         status=200)
                else:
                    return json_response({'message': ('Bundled fw file not '
                                                     'found for module of '
                                                     f'type: {module.name()}'),
                                         status=404)
            except modules.UpdateError as e:
                return json_response({'message': f'Bootloader error: {e}'},
                                     status=400)
            except asyncio.TimeoutError:
                return json_response({'message': 'Module not responding'},
                                     status=500)
            break
    return json_response({'message': f'Module {serial} not found'},
                         status=404)
