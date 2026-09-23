from typing import List, Optional

from typing_extensions import Protocol

from ..modules import AbstractModule, ModuleModel


class ModuleProvider(Protocol):
    """A protocol specifying access to modules."""

    @property
    def attached_modules(self) -> List[AbstractModule]:
        """Return a list of currently-attached modules."""
        ...

    async def get_attached_modules(self) -> List[AbstractModule]:
        """Returns a list of currently-attached modules in a way friendly to remote callers."""
        ...

    async def get_attached_module_by_serial(self, serial: str) -> AbstractModule:
        """Return a single attached module, if present. raise ModuleNotPresent if not."""
        ...

    async def create_simulating_module(
        self, model: ModuleModel, sim_serial: Optional[str] = None
    ) -> AbstractModule:
        """Create a simulating module hardware interface."""
        ...

    async def update_module(self, module_serial: str) -> None:
        """Update a module's firmware from the built in file, if any.

        This is more remote-call friendly than calling
        hardware_control.modules.update.update_firmware on a proxy object because it will
        actually run everything in the hardware controller.
        """
        ...
