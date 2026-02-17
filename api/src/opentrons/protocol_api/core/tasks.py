from abc import ABC, abstractmethod
from datetime import datetime
from typing import TypeVar


class AbstractTaskCore(ABC):
    @abstractmethod
    def get_created_at_timestamp(self) -> datetime:
        """Get the createdAt timestamp of the task."""
        ...

    @abstractmethod
    def is_done(self) -> bool:
        """Returns ``True`` if the task is done."""
        ...

    @abstractmethod
    def is_started(self) -> bool:
        """Returns ``True`` if the task has started."""
        ...

    @abstractmethod
    def get_finished_at_timestamp(self) -> datetime | None:
        """The timestamp of the when the task finished.

        Returns ``None`` if the task hasn't finished yet.
        """
        ...


TaskCoreType = TypeVar("TaskCoreType", bound=AbstractTaskCore)
