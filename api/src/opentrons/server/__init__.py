#!/usr/bin/env python

import asyncio
import logging
import threading
import time
import traceback

from typing import TYPE_CHECKING
from aiohttp import web

from opentrons.config import CONFIG
from .rpc import RPCServer
from .http import HTTPServer
from opentrons.api.routers import MainRouter
import opentrons

if TYPE_CHECKING:
    from opentons.hardware_control.types import HardwareAPILike  # noqa(F501)

log = logging.getLogger(__name__)


@web.middleware
async def error_middleware(request, handler):
    try:
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


# Support for running using aiohttp CLI.
# See: https://docs.aiohttp.org/en/stable/web.html#command-line-interface-cli
def init(loop=None, hardware: 'HardwareAPILike' = None):
    """
    Builds an application and sets up RPC and HTTP servers with it.

    :param loop: A specific aiohttp event loop to use. If not specified, the
                 server will use the default event loop.
    :param hardware: The hardware manager or hardware adapter to connect to.
                     If not specified, the server will use
                     :py:attr:`opentrons.hardware`
    """

    app = web.Application(loop=loop, middlewares=[error_middleware])
    if hardware:
        checked_hardware = hardware
    else:
        checked_hardware = opentrons.hardware
    app['com.opentrons.hardware'] = checked_hardware
    app['com.opentrons.motion_lock'] = ThreadedAsyncLock()
    app['com.opentrons.rpc'] = RPCServer(
        app, MainRouter(
            checked_hardware, lock=app['com.opentrons.motion_lock']))
    app['com.opentrons.http'] = HTTPServer(app, CONFIG['log_dir'])

    return app


def run(hostname=None, port=None, path=None, loop=None):
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

    web.run_app(init(loop), host=hostname, port=port, path=path)
