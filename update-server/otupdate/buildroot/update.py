"""
otupdate.buildroot.update: endpoints for running software updates

This has endpoints like update session management, validation, and execution
"""

import asyncio
import functools
import logging
import os
from subprocess import CalledProcessError

from typing import Optional


from aiohttp import web, BodyPartReader

from .util import update_http_version
from .constants import APP_VARIABLE_PREFIX, RESTART_LOCK_NAME
from . import config, file_actions
from .update_session import UpdateSession, Stages

SESSION_VARNAME = APP_VARIABLE_PREFIX + 'session'
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


@update_http_version(1, 0)
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

    session = UpdateSession(
        config.config_from_request(request).download_storage_path)
    request.app[SESSION_VARNAME] = session
    return web.json_response(
        data={'token': session.token},
        status=201)


@update_http_version(1, 0)
async def cancel(request: web.Request) -> web.Response:
    request.app.pop(SESSION_VARNAME, None)
    return web.json_response(
        data={'message': 'Session cancelled'},
        status=200)


@require_session
@update_http_version(1, 0)
async def status(request: web.Request, session: UpdateSession) -> web.Response:
    return web.json_response(
        data=session.state,
        status=200)


@update_http_version(1, 0)
async def _save_file(part: BodyPartReader, path: str):
    with open(os.path.join(path, part.name), 'wb') as write:
        while not part.at_eof():
            chunk = await part.read_chunk()
            decoded = part.decode(chunk)
            write.write(decoded)


def _begin_write(session: UpdateSession,
                 loop: asyncio.AbstractEventLoop,
                 rootfs_file_path: str):
    """ Start the write process. """
    session.set_progress(0)
    session.set_stage(Stages.WRITING)
    write_future = asyncio.ensure_future(loop.run_in_executor(
        None, file_actions.write_update, rootfs_file_path,
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
        config: config.Config,
        loop: asyncio.AbstractEventLoop,
        downloaded_update_path: str)\
        -> asyncio.futures.Future:
    """ Start the validation process. """
    session.set_stage(Stages.VALIDATING)
    cert_path = config.update_cert_path\
        if config.signature_required else None

    validation_future \
        = asyncio.ensure_future(loop.run_in_executor(
            None, file_actions.validate_update,
            downloaded_update_path, session.set_progress, cert_path))

    def validation_done(fut):
        exc = fut.exception()
        if exc:
            session.set_error(getattr(exc, 'short', str(type(exc))),
                              str(exc))
        else:
            rootfs_file = fut.result()
            loop.call_soon_threadsafe(_begin_write,
                                      session,
                                      loop,
                                      rootfs_file)
    validation_future.add_done_callback(validation_done)
    return validation_future


@require_session
@update_http_version(1, 0)
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
        config.config_from_request(request),
        asyncio.get_event_loop(),
        os.path.join(session.download_path, 'ot2-system.zip'))

    return web.json_response(data=session.state,
                             status=201)


@require_session
@update_http_version(1, 0)
async def commit(
        request: web.Request, session: UpdateSession) -> web.Response:
    """ Serves /update/:session/commit """
    if session.stage != Stages.DONE:
        return web.json_response(
            data={'error': 'not-ready',
                  'message': f'System is not ready to commit the update '
                  f'(currently {session.stage.value.short})'},
            status=409)
    async with request.app[RESTART_LOCK_NAME]:
        try:
            with file_actions.mount_update() as new_part:
                file_actions.write_machine_id('/', new_part)
        except (OSError, CalledProcessError):
            LOG.exception('Failed to update machine-id')
        file_actions.commit_update()
        session.set_stage(Stages.READY_FOR_RESTART)

    return web.json_response(
        data=session.state,
        status=200)
