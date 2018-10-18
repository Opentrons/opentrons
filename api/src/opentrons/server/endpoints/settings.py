import logging
import shutil
import os
from aiohttp import web
from opentrons.config import advanced_settings as advs, robot_configs as rc
from opentrons.data_storage import database as db
from opentrons.protocol_api import labware

log = logging.getLogger(__name__)

_settings_reset_options = [
    {
        'id': 'tipProbe',
        'name': 'Tip Length',
        'description': 'Clear tip probe data'
    },
    {
        'id': 'labwareCalibration',
        'name': 'Labware Calibration',
        'description': 'Clear labware calibration'
    },
    {
        'id': 'bootScripts',
        'name': 'Boot Scripts',
        'description': 'Clear custom boot scripts'
    }
]


async def get_advanced_settings(request: web.Request) -> web.Response:
    """
    Handles a GET request and returns a json body with the key "settings" and a
    value that is a list of objects where each object has keys "id", "title",
    "description", and "value"
    """
    res = _get_adv_settings()
    return web.json_response(res)


def _get_adv_settings() -> dict:
    data = advs.get_all_adv_settings()
    return {"settings": list(data.values())}


async def set_advanced_setting(request: web.Request) -> web.Response:
    """
    Handles a POST request with a json body that has keys "id" and "value",
    where the value of "id" must correspond to an id field of a setting in
    `opentrons.config.advanced_settings.settings`. Saves the value of "value"
    for the setting that matches the supplied id.
    """
    data = await request.json()
    key = data.get('id')
    value = data.get('value')
    if key and key in advs.settings_by_id.keys():
        advs.set_adv_setting(key, value)
        res = _get_adv_settings()
        status = 200
    else:
        res = {'message': 'ID {} not found in settings list'.format(key)}
        status = 400
    return web.json_response(res, status=status)


async def reset(request: web.Request) -> web.Response:
    """ Execute a reset of the requested parts of the user configuration.
    """
    data = await request.json()
    for requested_reset in data.keys():
        if requested_reset not in [opt['id']
                                   for opt in _settings_reset_options]:
            log.error('Bad reset option {} requested'.format(requested_reset))
            return web.json_response(
                {'message': '{} is not a valid reset option'
                 .format(requested_reset)},
                status=400)
    log.info("Reset requested for {}".format(', '.join(data.keys())))
    if data.get('tipProbe'):
        config = rc.load()
        config.tip_length.clear()
        rc.save_robot_settings(config)
    if data.get('labwareCalibration'):
        db.reset()
        labware.clear_calibrations()
    if data.get('bootScripts'):
        if os.environ.get('RUNNING_ON_PI'):
            if os.path.exists('/data/boot.d'):
                shutil.rmtree('/data/boot.d')
        else:
            log.debug('Not on pi, not removing /data/boot.d')
    return web.json_response({}, status=200)


async def available_resets(request: web.Request) -> web.Response:
    """ Indicate what parts of the user configuration are available for reset.
    """
    return web.json_response({'options': _settings_reset_options}, status=200)
