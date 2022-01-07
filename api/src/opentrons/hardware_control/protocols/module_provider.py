from typing import List, Tuple, Optional
from typing_extensions import Protocol

from ..modules import AbstractModule
from ..modules.types import ModuleModel, ModuleType


class ModuleProvider(Protocol):
    """A protocol specifying access to modules."""

    @property
    def attached_modules(self) -> List[AbstractModule]:
        """Return a list of currently-attached modules."""
        ...

    async def find_modules(
        self,
        by_model: ModuleModel,
        resolved_type: ModuleType,
    ) -> Tuple[List[AbstractModule], Optional[AbstractModule]]:
        """Query the attached modules for a specific kind or model of module."""
        ...
