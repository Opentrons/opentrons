""" update-server implementation for openembedded systems """
import asyncio
import logging
from aiohttp import web

# from . import constants

# , name_management

from . import config, update
# from . import config, control, update, ssh_key_management
from openembedded import root_fs

LOG = logging.getLogger(__name__)


@web.middleware
async def log_error_middleware(request, handler):
    try:
        resp = await handler(request)
    except Exception:
        LOG.exception(f"Exception serving {request.method} {request.path}")
        raise
    return resp


def get_app(system_version_file: str = None,
            config_file_override: str = None,
            name_override: str = None,
            boot_id_override: str = None,
            rfs: root_fs.RootFS = root_fs.RootFS(),
            loop: asyncio.AbstractEventLoop = None) -> web.Application:
    """ Build and return the aiohttp.web.Application that runs the server

    """

    LOG.info('TODO')

    if not loop:
        loop = asyncio.get_event_loop()

    # name = 'todo'
    # boot_id = 'todo'

    config_obj = config.load(config_file_override)

    async def hello(request):
        print('hello')
        return web.Response(text="hello")
    app = web.Application(middlewares=[log_error_middleware])
    app[config.CONFIG_VARNAME] = config_obj
    # app[constants.RESTART_LOCK_NAME] = asyncio.Lock()
    # app[constants.DEVICE_BOOT_ID_NAME] = boot_id
    # app[constants.DEVICE_NAME_VARNAME] = name
    app.router.add_routes([
        web.post('/server/update/begin', update.begin),
        web.post('/server/oe/restore', rfs.factory_restore),
        web.post('/server/oe/swap', rfs.swap_partition),
        web.get('/server/oe/partition', rfs.get_partition_api),
        web.get('/server/oe/hello', hello),
    ])
    return app
