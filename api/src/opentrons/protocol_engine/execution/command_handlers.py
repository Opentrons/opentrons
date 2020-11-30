"""Command side-effect execution logic container."""
from __future__ import annotations

from opentrons.hardware_control.api import API as HardwareAPI

from ..resources import ResourceProviders
from ..state import StateView
from .equipment import EquipmentHandler
from .movement import MovementHandler
from .pipetting import PipettingHandler


class CommandHandlers:
    """
    CommandHandlers container class.

    CommandHandlers wraps various child handlers that define procedures to
    execute the side-effects of commands.
    """

    _equipment: EquipmentHandler
    _movement: MovementHandler
    _pipetting: PipettingHandler

    @classmethod
    def create(
        cls,
        hardware: HardwareAPI,
        state: StateView,
        resources: ResourceProviders,
    ) -> CommandHandlers:
        """Create a CommandHandlers container and its child handlers."""
        equipment = EquipmentHandler(
            state=state,
            hardware=hardware,
            resources=resources,
        )

        movement = MovementHandler(
            state=state,
            hardware=hardware
        )

        pipetting = PipettingHandler(
            state=state,
            hardware=hardware,
            movement_handler=movement,
        )

        return cls(
            equipment=equipment,
            movement=movement,
            pipetting=pipetting,
        )

    def __init__(
        self,
        equipment: EquipmentHandler,
        movement: MovementHandler,
        pipetting: PipettingHandler,
    ) -> None:
        """Initialize a CommandHandlers container."""
        self._equipment = equipment
        self._movement = movement
        self._pipetting = pipetting

    @property
    def equipment(self) -> EquipmentHandler:
        """Access equipment handling procedures."""
        return self._equipment

    @property
    def movement(self) -> MovementHandler:
        """Access movement handling procedures."""
        return self._movement

    @property
    def pipetting(self) -> PipettingHandler:
        """Access pipetting handling procedures."""
        return self._pipetting
