"""Pipetting command handling."""
from typing import Callable
from opentrons.types import Mount
from opentrons.hardware_control.api import API as HardwareAPI

from ..state import State

from ..command_models import (
    MoveToWellRequest,
    MoveToWellResult
)


class PipettingHandler():
    """Implementation logic for liquid handling commands."""

    def __init__(
        self,
        hardware: HardwareAPI,
        get_waypoints: Callable,
    ) -> None:
        """Initialize a PipettingHandler instance."""
        self._hardware: HardwareAPI = hardware
        self._get_waypoints: Callable = get_waypoints

    async def handle_move_to_well(
        self,
        request: MoveToWellRequest
    ) -> MoveToWellResult:
        """Move to a specific well."""
        mount = Mount.LEFT
        waypoints = self._get_waypoints("foo")

        for position, critical_point in waypoints:
            await self._hardware.move_to(
                mount=mount,
                abs_position=position,
                critical_point=critical_point
            )

        return MoveToWellResult()
