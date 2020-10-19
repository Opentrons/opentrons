"""Command implementation executor."""
from typing import Optional, Union

from opentrons.util.helpers import utc_now
from opentrons.hardware_control.api import API as HardwareAPI
from ..state import State
from ..errors import ProtocolEngineError, UnexpectedProtocolError
from .. import command_models as cmd
from .equipment import EquipmentHandler


class CommandExecutor():
    """Command side-effect router."""
    _equipment_handler: EquipmentHandler

    def __init__(
        self,
        hardware: HardwareAPI,
        equipment_handler: Optional[EquipmentHandler] = None
    ):
        self._equipment_handler = (
            equipment_handler
            if equipment_handler is not None
            else EquipmentHandler(hardware=hardware)
        )

    async def execute_command(
        self,
        command: cmd.RunningCommandType,
        state: State
    ) -> Union[cmd.CompletedCommandType, cmd.FailedCommandType]:
        try:
            return await self._try_to_execute_command(command, state)
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
        state: State
    ) -> cmd.CompletedCommandType:
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
                state=state
            )
            return command.to_completed(pip_res, utc_now())

        raise NotImplementedError(f"{type(command.request)} not implemented")
