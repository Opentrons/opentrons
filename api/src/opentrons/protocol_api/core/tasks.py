from abc import abstractmethod, ABC
from datetime import datetime


class AbstractTaskCore(ABC):
    @abstractmethod
    def get_created_at_timestamp(self) -> datetime:
        """Get the createdAt timestamp of the task."""
        ...

    @abstractmethod
    def is_done(self) -> bool:
        """Return whether the task is done."""
        ...

    @abstractmethod
    def is_started(self) -> bool:
        """Return whether the task has started."""
        ...

    @abstractmethod
    def get_finished_at_timestamp(self) -> datetime | None:
        """Get the finishedAt timestamp of the task, or None if not finished."""
        ...
