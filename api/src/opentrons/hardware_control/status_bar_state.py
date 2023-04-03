from .types import StatusBarState
from opentrons_hardware.hardware_control import status_bar


class StatusBarStateController:
    """Stateful control of the status bar."""

    def __init__(self, controller: status_bar.StatusBar) -> None:
        """Create a StatusBarStateController."""
        self._status_bar_state = StatusBarState.IDLE
        self._controller = controller

    async def _status_bar_idle(self) -> None:
        self._status_bar_state = StatusBarState.IDLE
        await self._controller.static_color(status_bar.WHITE)

    async def _status_bar_running(self) -> None:
        self._status_bar_state = StatusBarState.RUNNING
        await self._controller.static_color(status_bar.BLUE)

    async def _status_bar_paused(self) -> None:
        self._status_bar_state = StatusBarState.PAUSED
        await self._controller.pulse_color(status_bar.BLUE)

    async def _status_bar_hardware_error(self) -> None:
        self._status_bar_state = StatusBarState.HARDWARE_ERROR
        await self._controller.flash_color(status_bar.RED)

    async def _status_bar_software_error(self) -> None:
        self._status_bar_state = StatusBarState.SOFTWARE_ERROR
        await self._controller.static_color(status_bar.RED)

    async def _status_bar_confirm(self) -> None:
        # Confirm should revert to IDLE
        self._status_bar_state = StatusBarState.IDLE
        await self._controller.blink_once(status_bar.GREEN, status_bar.WHITE)

    async def _status_bar_run_complete(self) -> None:
        self._status_bar_state = StatusBarState.RUN_COMPLETED
        await self._controller.static_color(status_bar.GREEN)

    async def _status_bar_updating(self) -> None:
        self._status_bar_state = StatusBarState.UPDATING
        await self._controller.pulse_color(status_bar.WHITE)

    async def _status_bar_activation(self) -> None:
        # Activation should revert to IDLE
        self._status_bar_state = StatusBarState.IDLE
        await self._controller.blink_once(status_bar.BLUE, status_bar.WHITE)

    async def _status_bar_disco(self) -> None:
        # TODO - update implementation
        colors = [
            status_bar.GREEN,
            status_bar.YELLOW,
            status_bar.PURPLE,
            status_bar.ORANGE,
            status_bar.GREEN,
            status_bar.YELLOW,
            status_bar.PURPLE,
            status_bar.ORANGE,
            status_bar.WHITE,
        ]
        self._status_bar_state = StatusBarState.IDLE
        await self._controller.cycle_colors(colors)

    async def set_status_bar_state(self, state: StatusBarState) -> None:
        """Main interface to set a new state."""
        callbacks = {
            StatusBarState.IDLE: self._status_bar_idle,
            StatusBarState.RUNNING: self._status_bar_running,
            StatusBarState.PAUSED: self._status_bar_paused,
            StatusBarState.HARDWARE_ERROR: self._status_bar_hardware_error,
            StatusBarState.SOFTWARE_ERROR: self._status_bar_software_error,
            StatusBarState.CONFIRMATION: self._status_bar_confirm,
            StatusBarState.RUN_COMPLETED: self._status_bar_run_complete,
            StatusBarState.UPDATING: self._status_bar_updating,
            StatusBarState.ACTIVATION: self._status_bar_activation,
            StatusBarState.DISCO: self._status_bar_disco,
        }
        await callbacks[state]()

    def get_current_state(self) -> StatusBarState:
        """Get the current state."""
        return self._status_bar_state
