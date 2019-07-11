from json import JSONDecodeError
import logging
import os
import shutil
from typing import Dict, Tuple
from aiohttp import web
from opentrons.config import (advanced_settings as advs,
                              robot_configs as rc,
                              feature_flags as ff,
                              pipette_config as pc,
                              IS_ROBOT)
from opentrons.data_storage import database as db
from opentrons.protocol_api import labware

log = logging.getLogger(__name__)

if ff.use_protocol_api_v2():
    _settings_reset_options = [
        {
            'id': 'tipProbe',
            'name': 'Instrument Offset',
            'description': 'Clear instrument offset calibration data'
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
        },
        {
            'id': 'customLabware',
            'name': 'Custom Labware',
            'description': 'Clear custom labware definitions'
        }
    ]
else:
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


def _check_reset(reset_req: Dict[str, str]) -> Tuple[bool, str]:
    for requested_reset in reset_req.keys():
        if requested_reset not in [opt['id']
                                   for opt in _settings_reset_options]:
            log.error('Bad reset option {} requested'.format(requested_reset))
            return (False, requested_reset)
    return (True, '')


async def reset(request: web.Request) -> web.Response:  # noqa(C901)
    """ Execute a reset of the requested parts of the user configuration.
    """
    data = await request.json()
    ok, bad_key = _check_reset(data)
    if not ok:
        return web.json_response(
            {'message': '{} is not a valid reset option'
             .format(bad_key)},
            status=400)
    log.info("Reset requested for {}".format(', '.join(data.keys())))
    if data.get('tipProbe'):
        config = rc.load()
        if ff.use_protocol_api_v2():
            config = config._replace(
                instrument_offset=rc.build_fallback_instrument_offset({}))
        else:
            config.tip_length.clear()
        rc.save_robot_settings(config)
    if data.get('labwareCalibration'):
        labware.clear_calibrations()
        if not ff.use_protocol_api_v2():
            db.reset()

    if data.get('customLabware'):
        labware.delete_all_custom_labware()

    if data.get('bootScripts'):
        if IS_ROBOT:
            if os.path.exists('/data/boot.d'):
                shutil.rmtree('/data/boot.d')
        else:
            log.debug('Not on pi, not removing /data/boot.d')
    return web.json_response({}, status=200)


async def available_resets(request: web.Request) -> web.Response:
    """ Indicate what parts of the user configuration are available for reset.
    """
    return web.json_response({'options': _settings_reset_options}, status=200)


async def pipette_settings(request: web.Request) -> web.Response:
    res = {}
    for id in pc.known_pipettes():
        whole_config = pc.load_config_dict(id)
        res[id] = {
            'info': {
                'name': whole_config.get('name'),
                'model': whole_config.get('model')
            },
            'fields': pc.list_mutable_configs(pipette_id=id)
        }
    return web.json_response(res, status=200)


async def pipette_settings_id(request: web.Request) -> web.Response:
    pipette_id = request.match_info['id']
    if pipette_id not in pc.known_pipettes():
        return web.json_response(
            {'message': '{} is not a valid pipette id'.format(pipette_id)},
            status=404)
    whole_config = pc.load_config_dict(pipette_id)
    res = {
        'info': {
            'name': whole_config.get('name'),
            'model': whole_config.get('model')
        },
        'fields': pc.list_mutable_configs(pipette_id)
        }
    return web.json_response(res, status=200)


async def modify_pipette_settings(request: web.Request) -> web.Response:
    """
    Expects a dictionary with mutable configs
    wrapped in a `fields` key such as:
    {
        'fields': {
            'pickUpCurrent': {'value': some_value},
            'dropTipSpeed': {'value': some_value}
        }

    }
    If a value needs to be reset, simply type in the body formatted as above:
        'configKey': null

    }
    """
    pipette_id = request.match_info['id']
    whole_config = pc.load_config_dict(pipette_id)
    config_match = pc.list_mutable_configs(pipette_id)
    data = await request.json()
    if not data.get('fields'):
        return web.json_response(config_match, status=200)

    for key, value in data['fields'].items():
        if value and not isinstance(value['value'], bool):
            config = value['value']
            default = config_match[key]
            if config < default['min'] or config > default['max']:
                return web.json_response(
                    {'message': '{} out of range with {}'.format(key, config)},
                    status=412)
    pc.save_overrides(pipette_id, data['fields'], whole_config.get('model'))
    updated_configs = {'fields': pc.list_mutable_configs(pipette_id)}
    return web.json_response(updated_configs, status=200)


async def set_log_level(request: web.Request) -> web.Response:
    """
    Set the log level of the API logs (serial logs are unaffected)

    POST /settings/log_level {"log_level": str level} -> 200 OK

    The level has to be in ("debug", "info", "warning", "error")
    """

    try:
        body = await request.json()
    except JSONDecodeError:
        return web.json_response(status=400,
                                 data={"message": "Request must be json"})
    if 'log_level' not in body:
        return web.json_response(
            status=400,
            data={"message": "body must have log_level key"})

    log_level = body['log_level'].upper()
    level_val = getattr(logging, log_level, None)
    if level_val is None:
        return web.json_response(
            status=400,
            data={"message": f"invalid log_level {log_level}"})

    logging.getLogger('opentrons').setLevel(level_val)
    hw = request.app['com.opentrons.hardware']

    if ff.use_protocol_api_v2():
        await hw.update_config(log_level=log_level)
        conf = await hw.config
    else:
        hw.update_config(log_level=log_level)
        conf = hw.config
    rc.save_robot_settings(conf)
    return web.json_response(
        status=200,
        data={'message': f'log_level set to {log_level}'})
