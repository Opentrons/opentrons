from json import JSONDecodeError
import logging
from typing import Dict, List, Union
from aiohttp import web
from opentrons.config import (advanced_settings as advs,
                              robot_configs as rc,
                              pipette_config as pc,
                              ARCHITECTURE,
                              SystemArchitecture)
from opentrons.config import reset as reset_util

if ARCHITECTURE == SystemArchitecture.BUILDROOT:
    from opentrons.system import log_control

log = logging.getLogger(__name__)

_SETTINGS_RESTART_REQUIRED = False
# This is a bit of global state that indicates whether a setting has changed
# that requires a restart. It's OK for this to be global because the behavior
# it's catching is global - changing the kind of setting that requires a
# a restart anywhere, even if you theoretically have two servers running in
# the same process, will require _all_ of them to be restarted.


async def get_advanced_settings(request: web.Request) -> web.Response:
    """
    Handles a GET request and returns a json body with the key "settings" and a
    value that is a list of objects where each object has keys "id", "title",
    "description", and "value"
    There is also a 'links' subobject that reflects whether an advanced setting
    has been changed that requires a subsequent restart. If one is required,
    then the "restart" key of links will hold a URI to the restart link.
    """
    return web.json_response(_get_adv_settings_response(),
                             status=200)


def _get_adv_settings_response() -> Dict[
        str, Union[Dict[str, str],
                   List[Dict[str, Union[str, bool, None]]]]]:
    data = advs.get_all_adv_settings()

    def _should_show(setting_dict):
        if not setting_dict['show_if']:
            return True
        return advs.get_setting_with_env_overload(setting_dict['show_if'][0])\
            == setting_dict['show_if'][1]

    if _SETTINGS_RESTART_REQUIRED:
        links = {'restart': '/server/restart'}
    else:
        links = {}

    return {
        'links': links,
        'settings': [
            {k: v for k, v in setting.items() if k != 'show_if'}
            for setting in data.values()
            if _should_show(setting)]}


async def set_advanced_setting(request: web.Request) -> web.Response:
    """ Set a specific advanced setting.

    The "id" field must correspond to an id field of a setting in
    `opentrons.config.advanced_settings.settings`. Saves the value of
    "value" for the setting that matches the supplied id.

    The response body includes the new settings in the same format as
    GET /settings, and a "links" object that may contain a "restart"
    key. If the "restart" key is present, the client should restart
    the robot, and the value is a URI that will do so.

    POST /settings {"id": short-id, "value": tristate new-value}

    -> 400 Bad Request {"error": error-shortname, "message": str}
    -> 500 Internal Server Error {"error": "error-shortname", "message": str}
    -> 200 OK {"settings": (as GET /settings),
               "links": {"restart": uri if restart required}}
    """
    global _SETTINGS_RESTART_REQUIRED
    data = await request.json()
    key = data.get('id')
    value = data.get('value')
    log.info(f'set_advanced_setting: {key} -> {value}')
    setting = advs.settings_by_id.get(key)
    if not setting:
        log.warning(f'set_advanced_setting: bad request: {key} invalid')
        return web.json_response(
            {'error': 'no-such-advanced-setting',
             'message': f'ID {key} not found in settings list',
             'links': {}},
            status=400)

    old_val = advs.get_adv_setting(key)
    advs.set_adv_setting(key, value)

    if key == 'disableLogAggregation'\
       and ARCHITECTURE == SystemArchitecture.BUILDROOT:
        code, stdout, stderr = await log_control.set_syslog_level(
            'emerg' if value else 'info')
        if code != 0:
            log.error(
                f"Could not set log control: {code}: stdout={stdout}"
                f" stderr={stderr}")
            return web.json_response(
                {'error': 'log-config-failure',
                 'message': 'Failed to set log upstreaming: {code}'},
                status=500)

    _SETTINGS_RESTART_REQUIRED = _SETTINGS_RESTART_REQUIRED or (
        setting.restart_required and old_val != value)
    return web.json_response(
        _get_adv_settings_response(),
        status=200,
    )


async def reset(request: web.Request) -> web.Response:
    """ Execute a reset of the requested parts of the user configuration.

    POST /settings/reset {resetOption: Any}

    -> 200 OK, {"links": {"restart": uri}}
    -> 400 Bad Request, {"error": error-shortmessage, "message": str}
    """
    data = await request.json()

    try:
        # Convert to dict of ResetOptionId to value
        data = {reset_util.ResetOptionId(k): v for k, v in data.items()}

        # We provide the parts that should be reset. Any with a
        # non-falsey value.
        reset_util.reset(set(k for k, v in data.items() if v))
    except ValueError as e:
        return web.json_response(
            {
                'error': 'bad-reset-option',
                'message': str(e)
            },
            status=400
        )

    return web.json_response({}, status=200)


async def available_resets(request: web.Request) -> web.Response:
    """ Indicate what parts of the user configuration are available for reset.
    """
    options = reset_util.reset_options()
    return web.json_response({
        'options': [{
            'id': k.value,
            'name': v.name,
            'description': v.description
        } for k, v in options.items()]
    },
        status=200)


async def pipette_settings(request: web.Request) -> web.Response:
    res = {}
    for pipette_id in pc.known_pipettes():
        whole_config = pc.load_config_dict(pipette_id)
        res[pipette_id] = {
            'info': {
                'name': whole_config.get('name'),
                'model': whole_config.get('model')
            },
            'fields': pc.list_mutable_configs(pipette_id=pipette_id)
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

    data = await request.json()
    fields = data.get('fields', {})
    # Convert fields to dict of field name to value
    fields = {k: v.get('value') for k, v in fields.items()}
    if fields:
        try:
            pc.override(fields=fields, pipette_id=pipette_id)
        except ValueError as e:
            return web.json_response({'message': str(e)}, status=412)

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

    await hw.update_config(log_level=log_level)
    rc.save_robot_settings(hw.config)
    return web.json_response(
        status=200,
        data={'message': f'log_level set to {log_level}'})


async def get_robot_settings(request: web.Request) -> web.Response:
    """
    Handles a GET request and returns a body that is the JSON
    representation of all internal robot settings and gantry calibration
    """

    hw = request.app['com.opentrons.hardware']

    return web.json_response(hw.config._asdict(), status=200)
