"""
otupdate.buildroot.update: endpoints for running software updates

This has endpoints like update session management, validation, and execution
"""

import asyncio
import base64
from collections import namedtuple
import concurrent
import enum
import functools
import logging
import os
import shutil
from typing import Mapping, Optional
import uuid

from aiohttp import web, BodyPartReader

from .constants import APP_VARIABLE_PREFIX, RESTART_LOCK_NAME
from . import config, file_actions

Value = namedtuple('Value', ('short', 'human'))

SESSION_VARNAME = APP_VARIABLE_PREFIX + 'session'
LOG = logging.getLogger(__name__)


class Stages(enum.Enum):
    AWAITING_FILE = Value('awaiting-file', 'Waiting for update file')
    VALIDATING = Value('validating', 'Validating update file')
    WRITING = Value('writing', 'Writing update to system')
    DONE = Value('done', 'Ready to commit update')
    READY_FOR_RESTART = Value('ready-for-restart', 'Ready for restart')
    ERROR = Value('error', 'Error')


class UpdateSession:
    """
    State machine for update sessions
    """
    def __init__(self, conf: config.Config) -> None:
        self._token = base64.urlsafe_b64encode(uuid.uuid4().bytes).decode()
        self._stage = Stages.AWAITING_FILE
        self._progress = 0.0
        self._message = ''
        self._error: Optional[Value] = None
        self._config = conf
        self._setup_dl_area()
        self._validation_future: Optional[asyncio.Future] = None
        self._rootfs_file: Optional[str] = None
        self._loop = asyncio.get_event_loop()
        self._current_task: Optional[concurrent.future.Future] = None
        LOG.info(f"Update session: created {self._token}")

    def _setup_dl_area(self):
        if os.path.exists(self._config.download_storage_path):
            shutil.rmtree(self._config.download_storage_path)
        os.makedirs(self._config.download_storage_path,
                    mode=0o700, exist_ok=True)

    def __del__(self):
        if hasattr(self, '_config'):
            shutil.rmtree(self._config.download_storage_path)
        LOG.info(
            f"Update session: removed {getattr(self, '_token', '<unknown>')}")

    def set_stage(self, stage: Stages):
        """ Convenience method to set the stage and lookup message """
        assert stage in Stages
        LOG.info(f'Update session: stage {self._stage.name}->{stage.name}')
        self._stage = stage

    def set_error(self, error_shortmsg: str, error_longmsg: str):
        """ Set the stage to error and add a message """
        LOG.error(f"Update session: error in stage {self._stage.name}: "
                  f"{error_shortmsg}: {error_longmsg}")
        self._error = Value(error_shortmsg, error_longmsg)
        self.set_stage(Stages.ERROR)

    @property
    def current_task(self) -> Optional[concurrent.futures.Future]:
        return self._current_task

    def begin_validation(
            self, downloaded_update_path: str) -> concurrent.futures.Future:
        """ Start the validation process. """
        self.set_stage(Stages.VALIDATING)
        cert_path = self._config.update_cert_path\
            if self._config.signature_required else None

        validation_future \
            = self._loop.run_in_executor(
                None, file_actions.validate_update,
                downloaded_update_path, self.set_progress, cert_path)

        def validation_done(fut):
            exc = fut.exception()
            if exc:
                self.set_error(getattr(exc, 'short', str(type(exc))),
                               str(exc))
                self._current_task = None
            else:
                rootfs_file = fut.result()
                self._loop.call_soon_threadsafe(self.begin_write,
                                                rootfs_file)
        validation_future.add_done_callback(validation_done)
        self._current_task = validation_future
        return validation_future

    def begin_write(self, rootfs_file_path: str):
        """ Start the write process. """
        self.set_progress(0)
        self.set_stage(Stages.WRITING)
        write_future = asyncio.get_event_loop().run_in_executor(
            None, file_actions.write_update, rootfs_file_path,
            self.set_progress)

        def write_done(fut):
            exc = fut.exception()
            if exc:
                self.set_error(getattr(exc, 'short', str(type(exc))),
                               str(exc))
            else:
                self.set_stage(Stages.DONE)
            self._current_task = None

        write_future.add_done_callback(write_done)
        self._current_task = write_future

    def set_progress(self, progress: float) -> None:
        self._progress = progress

    @property
    def download_path(self) -> str:
        return self._config.download_storage_path

    @property
    def rootfs_file(self) -> str:
        assert self._rootfs_file
        return self._rootfs_file

    @property
    def token(self) -> str:
        return self._token

    @property
    def stage(self) -> Stages:
        return self._stage

    @property
    def progress(self) -> float:
        return self._progress

    @property
    def is_error(self) -> bool:
        return self.stage == Stages.ERROR

    @property
    def error(self) -> Value:
        """ The current error, or an empty value """
        if not self._error:
            return Value('', '')
        return self._error

    @property
    def message(self) -> str:
        """ The human readable message of the current stage """
        if self.is_error:
            return self._error.human
        else:
            return self._stage.value.human

    @property
    def state(self) -> Mapping[str, str]:
        if self.is_error:
            return {'stage': self.stage.value.short,
                    'error': self.error.short,
                    'message': self.message}
        else:
            return {'stage': self.stage.value.short,
                    'progress': self.progress,
                    'message': self.message}


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

    session = UpdateSession(config.config_from_request(request))
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

    session.begin_validation(
        os.path.join(session.download_path, 'ot2-system.zip'))

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
    async with request.app[RESTART_LOCK_NAME]:
        file_actions.commit_update()
        session.set_stage(Stages.READY_FOR_RESTART)

    return web.json_response(
        data=session.state,
        status=200)
