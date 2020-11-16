"""Command executor router class."""
from __future__ import annotations
from typing import Union

from opentrons.util.helpers import utc_now
from opentrons.hardware_control.api import API as HardwareAPI
from ..state import StateView
from ..errors import ProtocolEngineError, UnexpectedProtocolError
from .. import resources, command_models as cmd
from .equipment import EquipmentHandler
from .movement import MovementHandler
from .pipetting import PipettingHandler


class CommandExecutor:
    """
    CommandExecutor class.

    A CommandExecutor manages triggering the side-effects of a given command
    and collecting the results of those side-effects.
    """

    _equipment_handler: EquipmentHandler
    _movement_handler: MovementHandler
    _pipetting_handler: PipettingHandler

    @classmethod
    def create(
        cls,
        hardware: HardwareAPI,
        state: StateView
    ) -> CommandExecutor:
        """Create a CommandExecutor instance."""
        id_generator = resources.IdGenerator()
        labware_data = resources.LabwareData()

        equipment_handler = EquipmentHandler(
            state=state,
            id_generator=id_generator,
            labware_data=labware_data,
            hardware=hardware,
        )

        movement_handler = MovementHandler(
            state=state,
            hardware=hardware
        )

        pipetting_handler = PipettingHandler(
            state=state,
            hardware=hardware,
            movement_handler=movement_handler,
        )

        return cls(
            equipment_handler=equipment_handler,
            movement_handler=movement_handler,
            pipetting_handler=pipetting_handler,
        )

    def __init__(
        self,
        equipment_handler: EquipmentHandler,
        movement_handler: MovementHandler,
        pipetting_handler: PipettingHandler,
    ) -> None:
        """
        Initialize a CommandExecutor.

        This constructor does not inject provider implementations. Prefer the
        CommandExecutor.create factory classmethod.
        """
        self._equipment_handler = equipment_handler
        self._movement_handler = movement_handler
        self._pipetting_handler = pipetting_handler

    async def execute_command(
        self,
        command: cmd.RunningCommandType,
    ) -> Union[cmd.CompletedCommandType, cmd.FailedCommandType]:
        """Execute a Command, returning a CompletedCommand or FailedCommand."""
        try:
            return await self._try_to_execute_command(command)
        except ProtocolEngineError as error:
            return command.to_failed(error, utc_now())
        except Exception as unhandled_error:
            return command.to_failed(
                UnexpectedProtocolError(unhandled_error),
                utc_now()
            )

    # TODO(mc, 2020-11-12): this routing logic is not scaling well. Re-work
    # the base command model interface so that a command contains a method
    # needed to execute itself, and the CommandExecutor calls that method.
    async def _try_to_execute_command(
        self,
        command: cmd.RunningCommandType,
    ) -> cmd.CompletedCommandType:
        """Execute commands by routing to specific handlers."""
        # call to correct implementation based on command request type
        # load labware
        if isinstance(command.request, cmd.LoadLabwareRequest):
            lw_res = await self._equipment_handler.handle_load_labware(
                command.request
            )
            return command.to_completed(lw_res, utc_now())

        # load pipette
        elif isinstance(command.request, cmd.LoadPipetteRequest):
            pip_res = await self._equipment_handler.handle_load_pipette(
                command.request,
            )
            return command.to_completed(pip_res, utc_now())

        # move to well
        elif isinstance(command.request, cmd.MoveToWellRequest):
            move_res = await self._movement_handler.handle_move_to_well(
                command.request
            )
            return command.to_completed(move_res, utc_now())

        # pick up tip
        elif isinstance(command.request, cmd.PickUpTipRequest):
            pick_up_res = await self._pipetting_handler.handle_pick_up_tip(
                command.request
            )
            return command.to_completed(pick_up_res, utc_now())

        raise NotImplementedError(f"{type(command.request)} not implemented")
