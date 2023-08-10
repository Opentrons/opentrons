"""Class to monitor estop status."""
import logging
from typing import TYPE_CHECKING
from .models import EstopState, EstopPhysicalStatus
from opentrons.config.feature_flags import require_estop

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API

log = logging.getLogger(__name__)


class EstopHandler:
    """Robot server interface for estop interactions."""

    _hardware_handle: "OT3API"

    def __init__(
        self,
        hw_handle: "OT3API",
    ) -> None:
        """Create a new EstopHandler."""
        self._hardware_handle = hw_handle

    def get_state(self) -> EstopState:
        """Get the current estop state."""
        state = EstopState.from_hw_state(self._hardware_handle.estop_status.state)
        if state == EstopState.NOT_PRESENT and not require_estop():
            return EstopState.DISENGAGED
        return state

    def get_left_physical_status(self) -> EstopPhysicalStatus:
        """Get the physical status of the left estop."""
        return EstopPhysicalStatus.from_hw_physical_status(
            self._hardware_handle.estop_status.left_physical_state
        )

    def get_right_physical_status(self) -> EstopPhysicalStatus:
        """Get the physical status of the right estop."""
        return EstopPhysicalStatus.from_hw_physical_status(
            self._hardware_handle.estop_status.right_physical_state
        )

    def acknowledge_and_clear(self) -> None:
        """Clear and acknowledge an Estop event."""
        self._hardware_handle.estop_acknowledge_and_clear()
