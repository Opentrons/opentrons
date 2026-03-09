from typing import List
from typing_extensions import Protocol

from ..modules import AbstractModule, ModuleModel


class ModuleProvider(Protocol):
    """A protocol specifying access to modules."""

    @property
    def attached_modules(self) -> List[AbstractModule]:
        """Return a list of currently-attached modules."""
        ...

    async def create_simulating_module(self, model: ModuleModel) -> AbstractModule:
        """Create a simulating module hardware interface."""
