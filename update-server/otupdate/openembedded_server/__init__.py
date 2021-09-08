""" update-server implementation for openembedded systems """
import asyncio
import logging
from aiohttp import web
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
            rfs: root_fs.RootFS = None,
            loop: asyncio.AbstractEventLoop = None) -> web.Application:
    """ Build and return the aiohttp.web.Application that runs the server

    """
    LOG.info('TODO')

    if not loop:
        loop = asyncio.get_event_loop()

    async def hello(request):
        print('hello')
        return web.Response(text="hello")
    app = web.Application(middlewares=[log_error_middleware])
    app.router.add_routes([
        web.post('/server/oe/restore', rfs.factory_restore),
        web.post('/server/oe/swap', rfs.swap_partition),
        web.get('/server/oe/partition', rfs.get_partition_api),
        web.get('/server/oe/hello', hello),
    ])
    return app
