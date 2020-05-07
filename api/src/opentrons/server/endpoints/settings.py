from json import JSONDecodeError
import logging
from typing import Dict, List, Union
from aiohttp import web
from opentrons.config import (advanced_settings as advs,
                              robot_configs as rc,
                              pipette_config as pc)
from opentrons.config import reset as reset_util

log = logging.getLogger(__name__)


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

    if advs.is_restart_required():
        links = {'restart': '/server/restart'}
    else:
        links = {}

    return {
        'links': links,
        'settings': [{
            "id": s.definition.id,
            "old_id": s.definition.old_id,
            "title": s.definition.title,
            "description": s.definition.description,
            "restart_required": s.definition.restart_required,
            "value": s.value
        } for s in data.values()]
    }


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
    data = await request.json()
    key = data.get('id')
    value = data.get('value')
    log.info(f'set_advanced_setting: {key} -> {value}')

    try:
        await advs.set_adv_setting(key, value)
    except ValueError as e:
        log.warning(f'set_advanced_setting: bad request: {key} invalid')
        return web.json_response({
            'error': 'no-such-advanced-setting',
            'message': str(e),
            'links': {}}, status=400)
    except advs.SettingException as e:
        # Severe internal error
        return web.json_response({
            'error': e.error,
            'message': str(e),
            'links': {}}, status=500)

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
        res[pipette_id] = _make_pipette_response_body(pipette_id)
    return web.json_response(res, status=200)


async def pipette_settings_id(request: web.Request) -> web.Response:
    pipette_id = request.match_info['id']
    if pipette_id not in pc.known_pipettes():
        return web.json_response(
            {'message': '{} is not a valid pipette id'.format(pipette_id)},
            status=404)
    res = _make_pipette_response_body(pipette_id)
    return web.json_response(res, status=200)


def _make_pipette_response_body(pipette_id):
    whole_config = pc.load_config_dict(pipette_id)
    res = {
        'info': {
            'name': whole_config.get('name'),
            'model': whole_config.get('model')
        },
        'fields': pc.list_mutable_configs(pipette_id)
    }
    return res


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
    fields = {k: None if v is None else v.get('value')
              for k, v in fields.items()}
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
