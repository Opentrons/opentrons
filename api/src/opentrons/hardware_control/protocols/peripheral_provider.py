from typing import List, Optional

from typing_extensions import Protocol

from ..peripherals import AbstractPeripheral, PeripheralModel


class PeripheralProvider(Protocol):
    """A protocol specifying access to peripherals."""

    @property
    def attached_peripherals(self) -> List[AbstractPeripheral]:
        """Return a list of currently-attached peripheral."""
        ...

    async def create_simulating_peripheral(
        self, model: PeripheralModel, sim_serial: Optional[str] = None
    ) -> AbstractPeripheral:
        """Create a simulating peripheral hardware interface."""
        ...
