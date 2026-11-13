"""
Update session object for tracking state across multiple calls
"""

import asyncio
import base64
import enum
import logging
import os
import shutil
import threading
import uuid
from typing import Mapping, NamedTuple, Optional, Union

from server_utils.fastapi_utils.app_state import AppState, AppStateAccessor

LOG = logging.getLogger(__name__)


class UpdateCancelled(Exception):
    """Raised when an update session is cancelled during validate or write."""


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
        self._cancelled = threading.Event()
        self._pipeline_task: asyncio.Task[None] | None = None
        self._commit_started = False

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

    def request_cancel(self) -> None:
        """Signal the pipeline to stop at the next progress checkpoint."""
        self._cancelled.set()

    def check_not_cancelled(self) -> None:
        """Raise UpdateCancelled if cancel has been requested."""
        if self._cancelled.is_set():
            raise UpdateCancelled()

    def set_pipeline_task(self, task: asyncio.Task[None]) -> None:
        """Record the background validate/write/commit task for this session."""
        self._pipeline_task = task

    async def wait_for_pipeline(self) -> None:
        """Wait until the background pipeline has stopped.

        Must be called after request_cancel() so the pipeline can abort. Do not
        delete session storage until this returns.
        """
        task = self._pipeline_task
        if task is None:
            return
        try:
            await task
        except Exception:
            LOG.exception(
                f"Update session {self._token}: pipeline finished with an error during cancel"
            )

    def start_commit(self) -> bool:
        """Claim commit for this session.

        Returns False if the session is not ready, has been cancelled, or a
        commit is already in progress. Does not change the public stage.
        """
        if self._cancelled.is_set():
            return False
        if self._stage != Stages.DONE:
            return False
        if self._commit_started:
            return False
        self._commit_started = True
        return True

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
        self.check_not_cancelled()
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
_session_lock_accessor = AppStateAccessor[asyncio.Lock]("otupdate_session_lock")


def install_session_lock(app_state: AppState) -> None:
    """Create the lock that serializes begin/cancel. Call during server startup."""
    _session_lock_accessor.set_on(app_state, asyncio.Lock())


def get_session_lock(app_state: AppState) -> asyncio.Lock:
    """Return the lock that serializes begin/cancel."""
    session_lock = _session_lock_accessor.get_from(app_state)
    assert session_lock is not None, "Forgot to install_session_lock() during startup?"
    return session_lock


def get_current_session(app_state: AppState) -> UpdateSession | None:
    """Return the update session currently active on this server, if there is one."""
    return _session_accessor.get_from(app_state)


def set_current_session(app_state: AppState, session: UpdateSession | None) -> None:
    """Set (or, with `None`, clear) the update session active on this server."""
    _session_accessor.set_on(app_state, session)
