"""
Backend for the balena->buildroot migration.

Not intended to be a freestanding server but adds endpoints to one or the other
under /migration with a similar flow to that of the buildroot update process
(but with less configuration and different required files).
"""

from aiohttp import web
from . import endpoints, constants


def add_endpoints(app: web.Application, robot_name: str) -> web.Application:
    app.router.add_routes([
        web.post('/server/update/migration/begin', endpoints.begin),
        web.post('/server/update/migration/cancel', endpoints.cancel),
        web.get('/server/update/migration/{session}/status',
                endpoints.status),
        web.post('/server/update/migration/{session}/file',
                 endpoints.file_upload),
        web.post('/server/update/migration/{session}/commit',
                 endpoints.commit),
        web.post('/server/update/restart',
                 endpoints.restart)
    ])
    app[constants.ROBOT_NAME_VARNAME] = robot_name
    return app
