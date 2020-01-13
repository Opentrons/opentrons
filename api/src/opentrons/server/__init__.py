#!/usr/bin/env python

import asyncio
import logging
import shutil
import tempfile
import threading
import time
import traceback

from typing import TYPE_CHECKING
from aiohttp import web

from multidict import MultiDict
from .util import HTTPVersionMismatchError
from opentrons.config import CONFIG
from .rpc import RPCServer
from .http import HTTPServerLegacy, HTTPServer
from opentrons.api.routers import MainRouter

if TYPE_CHECKING:
    from opentrons.hardware_control.types import HardwareAPILike  # noqa(F501)

log = logging.getLogger(__name__)


# @web.middleware
async def error_middleware(request, handler):
    try:
        print(request.headers)
        response = await handler(request)
    except web.HTTPNotFound:
        log.exception("Exception handler for request {}".format(request))
        data = {
            'message': 'File was not found at {}'.format(request)
        }
        response = web.json_response(data, status=404)
    except Exception as e:
        log.exception("Exception in handler for request {}".format(request))
        data = {
            'message': 'An unexpected error occured - {}'.format(e),
            'traceback': traceback.format_exc()
        }
        response = web.json_response(data, status=500)

    return response


@web.middleware
async def version_middleware(request, handler):
    """
    Helper middleware to route any requests to the default HTTP API (v0)
    webserver paths. If the route still does not exist in v0, then the
    error middleware will be called.
    """
    try:
        response = await handler(request)
    except HTTPVersionMismatchError as e:
        header_version = e.dErrorArguments['header_version']
        expected_version = e.dErrorArguments['expected_version']
        if header_version > expected_version:
            data = {
                "type": "error",
                "errorId": 1,
                "errorType": "unsupportedVersion",
                "message": msg,
                "supportedHttpApiVersions": {
                    "minimum": minVersion, "maximum": maxVersion},
                "links": {}
            }
            msg = """Requested Version {h} is not supported for the route
                provide. Max Version is {e}.
                """.format(h=header_version, e=expected_version)
            # Client is trying to use a version higher than supported
            response = web.json_response(data, status=405)
        else:
            updated_headers_dict = MultiDict(**request.headers)
            accept_header = updated_headers.get('Accept', '')
            new_header = accept_header.replace(f'={header_version}', f'={expected_version}')
            updated_headers_dict.update(Accept=new_header)
            updated_request = request.clone(
                method=request.method,
                rel_url=request.rel_url,
                headers=updated_headers_dict,
                scheme=request.scheme,
                host=request.host,
                remote=request.remote)
            # TODO look up older equivalent of a request
            response = await error_middleware(updated_request, handler)
    return response


async def add_header(request, response):
    version = '1.0'
    response.headers['X-Opentrons-Media-Type'] = f'opentrons.api.{version}'


class ThreadedAsyncLock:
    """ A thread-safe async lock

    This is required to properly lock access to motion calls, which are
    a) done in async contexts (rpc methods and http methods) and should
       block as little as possible
    b) done from several different threads (rpc workers and main thread)

    This is a code wart that needs to be removed. It can be removed by
    - making smoothie async so we don't need worker threads anymore
    - removing said threads

    This object can be used as either an asynchronous context manager using
    ``async with`` or a synchronous context manager using ``with``.
    """

    def __init__(self):
        self._thread_lock = threading.RLock()

    async def __aenter__(self):
        pref = f"[ThreadedAsyncLock tid {threading.get_ident()} "\
            f"task {asyncio.Task.current_task()}] "
        log.debug(pref + 'will acquire')
        then = time.perf_counter()
        while not self._thread_lock.acquire(blocking=False):
            await asyncio.sleep(0.1)
        now = time.perf_counter()
        log.debug(pref + f'acquired in {now-then}s')

    async def __aexit__(self, exc_type, exc, tb):
        log.debug(f"[ThreadedAsyncLock tid {threading.get_ident()} "
                  f"task {asyncio.Task.current_task()}] will release")
        self._thread_lock.release()

    def __enter__(self):
        self._thread_lock.acquire()

    def __exit__(self, exc_type, exc, tb):
        self._thread_lock.release()


class CombinedHTTPRoutes:
    def __init__(self, app, log_file_path):
        self.app = app
        self.log_file_path = log_file_path

        HTTPServerLegacy(app, log_file_path)
        HTTPServer(app, log_file_path)


# Support for running using aiohttp CLI.
# See: https://docs.aiohttp.org/en/stable/web.html#command-line-interface-cli
def init(hardware: 'HardwareAPILike' = None,
         loop: asyncio.AbstractEventLoop = None):
    """
    Builds an application and sets up RPC and HTTP servers with it.

    :param loop: A specific aiohttp event loop to use. If not specified, the
                 server will use the default event loop.
    :param hardware: The hardware manager or hardware adapter to connect to.
                     If not specified, the server will use
                     :py:attr:`opentrons.hardware`
    """
    app = web.Application(middlewares=[version_middleware])
    app['com.opentrons.hardware'] = hardware
    app['com.opentrons.motion_lock'] = ThreadedAsyncLock()
    app['com.opentrons.rpc'] = RPCServer(
        app, MainRouter(
            hardware, lock=app['com.opentrons.motion_lock'], loop=loop))
    app['com.opentrons.response_file_tempdir'] = tempfile.mkdtemp()
    app['com.opentrons.http'] = CombinedHTTPRoutes(app, CONFIG['log_dir'])

    async def dispose_response_file_tempdir(app):
        temppath = app.get('com.opentrons.response_file_tempdir')
        if temppath:
            try:
                shutil.rmtree(temppath)
            except Exception:
                log.exception(f"failed to remove app temp path {temppath}")

    app.on_response_prepare.append(add_header)
    app.on_shutdown.append(dispose_response_file_tempdir)
    app.on_shutdown.freeze()
    return app


def run(hardware: 'HardwareAPILike',
        hostname=None,
        port=None,
        path=None,
        loop=None):
    """
    The arguments are not all optional. Either a path or hostname+port should
    be specified; you have to specify one.
    """
    if path:
        log.debug("Starting Opentrons server application on {}".format(
            path))
        hostname, port = None, None
    else:
        log.debug("Starting Opentrons server application on {}:{}".format(
            hostname, port))
        path = None

    web.run_app(init(hardware=hardware), host=hostname, port=port, path=path)
