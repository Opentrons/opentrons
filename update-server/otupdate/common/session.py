"""
utility subpackage for sessions.
Can we used accross different Opentorns servers.
sessions used to track stages, ensure multiple system
upgrades dont start at the same time,
token assignment, etc
"""

import base64
from collections import namedtuple
import enum
import logging
import os
import shutil
from typing import Mapping, Optional, Union
import uuid

import functools
from . import constants, config

from aiohttp import web

SESSION_VARNAME = constants.APP_VARIABLE_PREFIX + 'session'
LOG = logging.getLogger(__name__)

Value = namedtuple('Value', ('short', 'human'))


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
    def __init__(self, storage_path: str) -> None:
        self._token = base64.urlsafe_b64encode(uuid.uuid4().bytes)\
                            .decode().strip('=')
        self._stage = Stages.AWAITING_FILE
        self._progress = 0.0
        self._message = ''
        self._error: Optional[Value] = None
        self._storage_path = storage_path
        self._setup_dl_area()
        self._rootfs_file: Optional[str] = None
        LOG.info(f"update session: created {self._token}")

    def _setup_dl_area(self):
        if os.path.exists(self._storage_path):
            shutil.rmtree(self._storage_path)
        os.makedirs(self._storage_path,
                    mode=0o700, exist_ok=True)

    def __del__(self):
        if hasattr(self, '_storage_path'):
            shutil.rmtree(self._storage_path)
        LOG.info(
            f"Update session: removed {getattr(self, '_token', '<unknown>')}")

    def set_stage(self, stage: Stages):
        """ Covinience method to set the stage and lookup message """
        assert stage in Stages
        LOG.info(f'Update session: stage {self._stage.name}->{stage.name}')
        self._stage = stage

    def set_error(self, error_shortmsg: str, error_longmsg: str):
        """ Set the stage to error and add a message """
        LOG.error(f"Update session: error in stage {self._stage.name}: "
                  f"{error_shortmsg}: {error_longmsg}")
        self._error = Value(error_shortmsg, error_longmsg)
        self.set_stage(Stages.ERROR)

    def set_progress(self, progress: float) -> None:
        self._progress = progress

    @property
    def download_path(self) -> str:
        return self._storage_path

    @property
    def rootfs_file(self) -> Optional[str]:
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
            assert self._error
            return self._error.human
        else:
            return self._stage.value.human

    @property
    def state(self) -> Mapping[str, Union[str, float]]:
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


def active_session_check(handler):
    """ decorator to check session status
    """
    @functools.wraps(handler)
    async def decorated(request: web.Request) -> web.Response:
        # checks if session exists!
        if session_from_request(request) is not None:
            LOG.warning("check_session: active session exists!")
            return web.json_response(
                data={'message':
                      'An update session is already active on this robot',
                      'error': 'session-already-active'},
                status=409)
        else:
            session = UpdateSession(
                config.config_from_request(request).download_storage_path)
            request.app[SESSION_VARNAME] = session
            return web.json_response(
                data={'token': session.token},
                status=201)
        return await handler(request)
    return decorated
