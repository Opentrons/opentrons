"""Status Bar command handling."""

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import StatusBarState


class StatusBarHandler:
    """Handle interaction with the status bar."""

    _hardware_api: HardwareControlAPI

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
    ) -> None:
        """Initialize a StatusBarHandler instance."""
        self._hardware_api = hardware_api

    async def set_status_bar(
        self,
        status: StatusBarState,
    ) -> None:
        """Set the status bar."""
        await self._hardware_api.set_status_bar_state(state=status)

    def status_bar_should_not_be_changed(self) -> bool:
        """Checks whether the status bar is seemingly busy."""
        state = self._hardware_api.get_status_bar_state()

        return state not in [
            StatusBarState.IDLE,
            StatusBarState.UPDATING,
            StatusBarState.OFF,
        ]
