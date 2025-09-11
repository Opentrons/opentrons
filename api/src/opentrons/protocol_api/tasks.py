"""Data for concurrent protocol tasks."""
from typing import TYPE_CHECKING
from datetime import datetime
from opentrons.protocols.api_support.util import requires_version
from opentrons.protocols.api_support.types import APIVersion

if TYPE_CHECKING:
    from .core.common import TaskCore


class Task:
    """A concurrent protocol task created by a protocol api function.

    .. versionadded:: 2.27
    """

    def __init__(self, core: "TaskCore", api_version: APIVersion) -> None:
        """Initialize a Task."""
        self._core = core
        self._api_version = api_version

    @property
    @requires_version(2, 27)
    def created_at(self) -> datetime:
        """The timestamp of when the task was created."""
        return self._core.get_created_at_timestamp()

    @property
    @requires_version(2, 27)
    def done(self) -> bool:
        """Whether the task is done."""
        return self._core.is_done()

    @property
    @requires_version(2, 27)
    def started(self) -> bool:
        """Whether the task has started."""
        return self._core.is_started()
        ...

    @property
    @requires_version(2, 27)
    def finished_at(self) -> datetime | None:
        """The timestamp of the when the task is finished, none if not finished."""
        return self._core.get_finished_at_timestamp()
