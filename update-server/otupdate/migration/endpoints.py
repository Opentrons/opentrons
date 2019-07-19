""" Endpoints for the migration update

"""

import asyncio
import functools
import logging
import os

from typing import Callable, Optional


from aiohttp import web, BodyPartReader

from . import constants

from otupdate.buildroot.file_actions import write_file
from otupdate.buildroot.update_session import UpdateSession, Stages
from .file_actions import (validate_update, find_inactive_sysroot,
                           migrate, UPDATE_FILES, BOOT_NAME)
from . import dbus_actions

SESSION_VARNAME = constants.APP_VARIABLE_PREFIX + 'session'
LOG = logging.getLogger(__name__)


def session_from_request(request: web.Request) -> Optional[UpdateSession]:
    return request.app.get(SESSION_VARNAME, None)


def require_session(handler):
    """ Decorator to ensure a session is properly in the request """
    @functools.wraps(handler)
    async def decorated(request: web.Request) -> web.Response:
        request_session_token = request.match_info['session']
        session = session_from_request(request)
        if not session or request_session_token != session.token:
            LOG.warning(f"request for invalid session {request_session_token}")
            return web.json_response(
                data={'error': 'bad-token',
                      'message': f'No such session {request_session_token}'},
                status=404)
        return await handler(request, session)
    return decorated


async def begin(request: web.Request) -> web.Response:
    """ Begin a session
    """
    if None is not session_from_request(request):
        LOG.warning("begin: requested with active session")
        return web.json_response(
            data={'message':
                  'An update session is already active on this robot',
                  'error': 'session-already-active'},
            status=409)

    session = UpdateSession(os.path.join(constants.DATA_DIR_NAME,
                                         'migration-updates'))
    request.app[SESSION_VARNAME] = session
    return web.json_response(
        data={'token': session.token},
        status=201)


async def cancel(request: web.Request) -> web.Response:
    request.app.pop(SESSION_VARNAME, None)
    return web.json_response(
        data={'message': 'Session cancelled'},
        status=200)


@require_session
async def status(request: web.Request, session: UpdateSession) -> web.Response:
    return web.json_response(
        data=session.state,
        status=200)


async def _save_file(part: BodyPartReader, path: str) -> web.Response:
    with open(os.path.join(path, part.name), 'wb') as write:
        while not part.at_eof():
            chunk = await part.read_chunk()
            decoded = part.decode(chunk)
            write.write(decoded)


def _write_and_migrate(rootfs_path: str,
                       robot_name: str,
                       progress_callback: Callable[[float], None]):
    with dbus_actions.unmount_sysroot_inactive():
        write_file(rootfs_path, find_inactive_sysroot(), progress_callback)
    migrate(UPDATE_FILES, robot_name)


def _begin_write(session: UpdateSession,
                 loop: asyncio.AbstractEventLoop,
                 rootfs_file_path: str,
                 robot_name: str):
    """ Start the write process. """
    session.set_progress(0)
    session.set_stage(Stages.WRITING)
    write_future = asyncio.ensure_future(loop.run_in_executor(
        None, _write_and_migrate, rootfs_file_path, robot_name,
        session.set_progress))

    def write_done(fut):
        exc = fut.exception()
        if exc:
            session.set_error(getattr(exc, 'short', str(type(exc))),
                              str(exc))
        else:
            session.set_stage(Stages.DONE)

    write_future.add_done_callback(write_done)


def _begin_validation(
        session: UpdateSession,
        loop: asyncio.AbstractEventLoop,
        downloaded_update_path: str,
        robot_name: str) -> asyncio.futures.Future:
    """ Start the validation process. """
    session.set_stage(Stages.VALIDATING)

    validation_future \
        = asyncio.ensure_future(loop.run_in_executor(
            None, validate_update,
            downloaded_update_path, session.set_progress))

    def validation_done(fut):
        exc = fut.exception()
        if exc:
            session.set_error(getattr(exc, 'short', str(type(exc))),
                              str(exc))
        else:
            rootfs_file, bootfs_file = fut.result()
            loop.call_soon_threadsafe(_begin_write,
                                      session,
                                      loop,
                                      rootfs_file,
                                      robot_name)
    validation_future.add_done_callback(validation_done)
    return validation_future


@require_session
async def file_upload(
        request: web.Request, session: UpdateSession) -> web.Response:
    """ Serves /update/:session/file

    Requires multipart (encoding doesn't matter) with a file field in the
    body called 'ot2-system.zip'.
    """
    if session.stage != Stages.AWAITING_FILE:
        return web.json_response(
            data={'error': 'file-already-uploaded',
                  'message': 'A file has already been sent for this update'},
            status=409)
    reader = await request.multipart()
    async for part in reader:
        if part.name != 'ot2-system.zip':
            LOG.warning(
                f"Unknown field name {part.name} in file_upload, ignoring")
            await part.release()
        else:
            await _save_file(part, session.download_path)

    _begin_validation(
        session,
        asyncio.get_event_loop(),
        os.path.join(session.download_path, 'ot2-system.zip'),
        request.app.get(constants.ROBOT_NAME_VARNAME, 'opentrons'))

    return web.json_response(data=session.state,
                             status=201)


@require_session
async def commit(
        request: web.Request, session: UpdateSession) -> web.Response:
    """ Serves /update/:session/commit """
    if session.stage != Stages.DONE:
        return web.json_response(
            data={'error': 'not-ready',
                  'message': f'System is not ready to commit the update '
                  f'(currently {session.stage.value.short})'},
            status=409)
    with dbus_actions.unmount_boot():
        write_file(os.path.join(session.download_path, BOOT_NAME),
                   constants.BOOT_PARTITION_NAME,
                   lambda x: None)

    session.set_stage(Stages.READY_FOR_RESTART)

    return web.json_response(
        data=session.state,
        status=200)


async def restart(request: web.Request) -> web.Response:
    """ Serves /update/server/restart """
    session = session_from_request(request)
    if session and session.stage != Stages.READY_FOR_RESTART:
        return web.json_response(
            data={'error': 'not-ready',
                  'message': 'System is not ready to restart '
                  f'(currently {session.stage.value.short})'},
            status=409)

    asyncio.get_event_loop().call_later(1, dbus_actions.restart)
    return web.json_response({'message': 'Restarting in 1s'},
                             status=200)
