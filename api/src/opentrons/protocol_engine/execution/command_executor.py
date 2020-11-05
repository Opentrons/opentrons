"""Command executor router class."""
from __future__ import annotations
from typing import Union

from opentrons.util.helpers import utc_now
from opentrons.hardware_control.api import API as HardwareAPI
from ..state import StateView
from ..errors import ProtocolEngineError, UnexpectedProtocolError
from .. import resources, command_models as cmd
from .equipment import EquipmentHandler


class CommandExecutor():
    """
    CommandExecutor class.

    A CommandExecutor manages triggering the side-effects of a given command
    and collecting the results of those side-effects.
    """

    @classmethod
    def create(
        cls,
        hardware: HardwareAPI,
        state: StateView
    ) -> CommandExecutor:
        """Create a CommandExecutor instance."""
        id_generator = resources.IdGenerator()
        labware_data = resources.LabwareData()

        return cls(
            equipment_handler=EquipmentHandler(
                state=state,
                id_generator=id_generator,
                labware_data=labware_data,
                hardware=hardware,
            ),
        )

    def __init__(
        self,
        equipment_handler: EquipmentHandler,
    ) -> None:
        """
        Initialize a CommandExecutor.

        This constructor does not inject provider implementations. Prefer the
        CommandExecutor.create factory classmethod.
        """
        self._equipment_handler = equipment_handler

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

    async def _try_to_execute_command(
        self,
        command: cmd.RunningCommandType,
    ) -> cmd.CompletedCommandType:
        """
        Private method to execute commands by routing to a specific command
        implementation class.
        """
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

        raise NotImplementedError(f"{type(command.request)} not implemented")
