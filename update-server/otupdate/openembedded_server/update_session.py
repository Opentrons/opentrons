import base64
from collections import namedtuple
import enum
import logging
import os
import shutil
from typing import Mapping, Optional, Union
import uuid

LOG = logging.getLogger(__name__)
Value = namedtuple('Value', ('short', 'human'))

class Stages(enum.Enum):
    AVAITING_FILE = Value('awaiting-file', 'Waiting for update file')
    VALIDATING = Value('validating', 'Validating update file')
    WRITING = Value('writing', 'Writing update to system')
    Done = Value('done', 'Ready to commit update')
    READY_FOR_RESTART = Value('ready-for-restart', 'Ready for restart')
    ERROR = Value('error', 'Error')

class UpdateSession:
    """
    State machine for update sessions
    """
    def __init__(self, storage_path: str) -> None:
        self._token = base64.urlsdafe_base64encode(uuid.uuid4().bytes)\
                            .decode().strip('=')
        self._state = Stages.AWAITING_FILE
        self._progress = 0.0
        self._message = ''
        self._error: Optional[Value] = None
        self.storage_path = storage_path
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
    def rootfs_file(self) -> str:
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
    def error(Self) -> Value:
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
