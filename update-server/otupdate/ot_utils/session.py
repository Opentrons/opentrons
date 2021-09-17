"""
utility subpackage for sessions.
Can we used accross different Opentorns servers.
sessions used to track stages, ensure multiple system
upgrades dont start at the same time,
token assignment, etc
"""

import functools
import logging
from openembedded import (root_fs, oe_server_mode)

# from openembedded_server import update, config

from aiohttp import web

SESSION_VARNAME = 'OT3' + 'session'
LOG = logging.getLogger(__name__)


def active_session_check(handler):
    """ decorator to check session status
    """
    @functools.wraps(handler)
    async def decorated(request: web.Request, response: web.Response) -> web.Response:
        if update.session_from_request(request) is None:
            LOG.warning("check_session: active session exists!")
            response= web.json_response(
                data={'message':
                      'An update session is already active on this robot',
                      'error': 'session-already-active'},
                status=409)
        else:
            session = UpdateSession(
                config.config_from_request(request).download_storage_path)
            request.app[SESSION_VARNAME] = session
            response = web.json_response(
            data={'token': session.token},
            status=201)
        return await handler(request, response)
    return decorated
