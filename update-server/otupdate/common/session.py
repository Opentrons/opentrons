"""
Update session object for tracking state across multiple calls
"""

import base64
import enum
import logging
import os
import shutil
import uuid
from typing import Mapping, NamedTuple, Optional, Union

from server_utils.fastapi_utils.app_state import AppState, AppStateAccessor

LOG = logging.getLogger(__name__)


class Value(NamedTuple):
    short: str
    human: str


class Stages(enum.Enum):
    AWAITING_FILE = Value("awaiting-file", "Waiting for update file")
    VALIDATING = Value("validating", "Validating update file")
    WRITING = Value("writing", "Writing update to system")
    DONE = Value("done", "Ready to commit update")
    READY_FOR_RESTART = Value("ready-for-restart", "Ready for restart")
    ERROR = Value("error", "Error")


class UpdateSession:
    """
    State machine for update sessions
    """

    def __init__(
        self,
        *,
        storage_path: str,
        auto_commit_and_restart: bool,
    ) -> None:
        self._token = base64.urlsafe_b64encode(uuid.uuid4().bytes).decode().strip("=")

        self._stage = Stages.AWAITING_FILE
        self._progress = 0.0
        self._message = ""
        self._error: Optional[Value] = None

        self._storage_path = storage_path
        self._auto_commit_and_restart = auto_commit_and_restart

        self._setup_dl_area()

        LOG.info(f"update session: created {self._token}")

    def _setup_dl_area(self) -> None:
        if os.path.exists(self._storage_path):
            shutil.rmtree(self._storage_path)
        os.makedirs(self._storage_path, mode=0o700, exist_ok=True)

    def close(self) -> None:
        """Clean up the storage used by this session."""
        shutil.rmtree(self._storage_path)
        LOG.info(f"Update session: removed {self._token}")

    def set_stage(self, stage: Stages) -> None:
        """Convenience method to set the stage and lookup message"""
        assert stage in Stages
        LOG.info(f"Update session: stage {self._stage.name}->{stage.name}")
        self._stage = stage

    def set_error(self, error_shortmsg: str, error_longmsg: str) -> None:
        """Set the stage to error and add a message"""
        LOG.error(
            f"Update session: error in stage {self._stage.name}: "
            f"{error_shortmsg}: {error_longmsg}"
        )
        self._error = Value(error_shortmsg, error_longmsg)
        self.set_stage(Stages.ERROR)

    def set_progress(self, progress: float) -> None:
        self._progress = progress

    @property
    def download_path(self) -> str:
        return self._storage_path

    @property
    def auto_commit_and_restart(self) -> bool:
        return self._auto_commit_and_restart

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
        """The current error, or an empty value"""
        if not self._error:
            return Value("", "")
        return self._error

    @property
    def message(self) -> str:
        """The human readable message of the current stage"""
        if self.is_error:
            assert self._error
            return self._error.human
        else:
            return self._stage.value.human

    @property
    def state(self) -> Mapping[str, Union[str, float]]:
        if self.is_error:
            return {
                "stage": self.stage.value.short,
                "error": self.error.short,
                "message": self.message,
            }
        else:
            return {
                "stage": self.stage.value.short,
                "progress": self.progress,
                "message": self.message,
            }


_session_accessor = AppStateAccessor[UpdateSession]("otupdate_session")


def get_current_session(app_state: AppState) -> UpdateSession | None:
    """Return the update session currently active on this server, if there is one."""
    return _session_accessor.get_from(app_state)


def set_current_session(app_state: AppState, session: UpdateSession | None) -> None:
    """Set (or, with `None`, clear) the update session active on this server."""
    _session_accessor.set_on(app_state, session)
