"""Command side-effect execution logic container."""
from __future__ import annotations

from opentrons.hardware_control.api import API as HardwareAPI

from ..resources import ResourceProviders
from ..state import StateStore
from ..commands import Command, CommandRequest
from .equipment import EquipmentHandler
from .movement import MovementHandler
from .pipetting import PipettingHandler


class CommandExecutor:
    """CommandExecutor container class.

    CommandExecutor manages various child handlers that define procedures to
    execute the side-effects of commands.
    """

    def __init__(
        self,
        hardware: HardwareAPI,
        state_store: StateStore,
        resources: ResourceProviders,
    ) -> None:
        """Initialize the CommandExecutor with access to its dependencies."""
        self._hardware = hardware
        self._state_store = state_store
        self._resources = resources

    def create_command(self, request: CommandRequest) -> Command:
        raise NotImplementedError("CommandExecutor not implemented")

    def to_running(self, command: Command) -> Command:
        raise NotImplementedError("CommandExecutor not implemented")

    async def execute(self, command: Command) -> Command:
        raise NotImplementedError("CommandExecutor not implemented")

    # async def execute(self, command: Command) -> CommandResult:
    #     state = self._state_store.state_view
    #     hardware = self._hardware
    #     resources = self._resources

    #     equipment = EquipmentHandler(
    #         state=state,
    #         hardware=hardware,
    #         resources=resources,
    #     )

    #     movement = MovementHandler(state=state, hardware=hardware)

    #     pipetting = PipettingHandler(
    #         state=state,
    #         hardware=hardware,
    #         movement_handler=movement,
    #     )

    #     command_impl = command.get_impl(
    #         equipment=equipment,
    #         movement=movement,
    #         pipetting=pipetting,
    #     )

    # @property
    # def equipment(self) -> EquipmentHandler:
    #     """Access equipment handling procedures."""
    #     return self._equipment

    # @property
    # def movement(self) -> MovementHandler:
    #     """Access movement handling procedures."""
    #     return self._movement

    # @property
    # def pipetting(self) -> PipettingHandler:
    #     """Access pipetting handling procedures."""
    #     return self._pipetting
