from datetime import datetime

from ..tasks import AbstractTaskCore
from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient
from opentrons.protocol_engine.errors.exceptions import NoTaskFoundError


class EngineTaskCore(AbstractTaskCore):
    def __init__(
        self, task_id: str | None, engine_client: ProtocolEngineClient
    ) -> None:
        self._id = task_id
        self._engine_client = engine_client

    def get_created_at_timestamp(self) -> datetime:
        if self._id is None:
            raise NoTaskFoundError
        try:
            task = self._engine_client.state.tasks.get(self._id)
            return task.createdAt
        except NoTaskFoundError:
            raise NoTaskFoundError

    def is_done(self) -> bool:
        if self._id is None:
            raise NoTaskFoundError
        try:
            self._engine_client.state.tasks.get_finished(self._id)
            return True
        except NoTaskFoundError:
            return False

    def is_started(self) -> bool:
        if self._id is None:
            raise NoTaskFoundError
        try:
            self._engine_client.state.tasks.get_current(self._id)
            return True
        except NoTaskFoundError:
            return self.is_done()

    def get_finished_at_timestamp(self) -> datetime | None:
        if self._id is None:
            raise NoTaskFoundError
        try:
            finished_task = self._engine_client.state.tasks.get_finished(self._id)
            return finished_task.finishedAt
        except NoTaskFoundError:
            return None
