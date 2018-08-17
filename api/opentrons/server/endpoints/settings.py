import logging
from aiohttp import web
from opentrons.config import advanced_settings as advs

log = logging.getLogger(__name__)


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
    return web.json_response({'message': 'Not implemented'}, status=501)


async def available_resets(request: web.Request) -> web.Response:
    """ Indicate what parts of the user configuration are available for reset.
    """
    return web.json_response({'message': 'Not implemented'}, status=501)
