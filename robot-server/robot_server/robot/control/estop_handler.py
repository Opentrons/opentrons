"""Class to monitor estop status."""

import logging
from typing import TYPE_CHECKING

from opentrons.config.feature_flags import require_estop

from .models import EstopPhysicalStatus, EstopState, EstopStatusModel

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

    async def get_status(self) -> EstopStatusModel:
        """Get the current estop state."""
        hw_status = await self._hardware_handle.get_estop_status()
        state = EstopState.from_hw_state(hw_status.state)
        if state == EstopState.NOT_PRESENT and not require_estop():
            state = EstopState.DISENGAGED
        return EstopStatusModel.model_construct(
            status=state,
            leftEstopPhysicalStatus=EstopPhysicalStatus.from_hw_physical_status(
                hw_status.left_physical_state
            ),
            rightEstopPhysicalStatus=EstopPhysicalStatus.from_hw_physical_status(
                hw_status.right_physical_state
            ),
        )

    async def acknowledge_and_clear(self) -> None:
        """Clear and acknowledge an Estop event."""
        await self._hardware_handle.estop_acknowledge_and_clear()
