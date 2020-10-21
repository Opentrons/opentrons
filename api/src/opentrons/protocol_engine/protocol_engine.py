"""ProtocolEngine class definition."""
from typing import Optional, Union

from opentrons.util.helpers import utc_now
from opentrons.hardware_control.api import API as HardwareAPI

from .execution import CommandExecutor
from .state import StateStore

from .command_models import (
    CommandRequestType,
    RunningCommandType,
    CompletedCommandType,
    FailedCommandType,
    RunningCommand
)


class ProtocolEngine():
    """
    Main ProtocolEngine class.

    A ProtocolEngine instance holds the state of a protocol as it executes,
    and manages calls to a command executor that actually implements the logic
    of the commands themselves.
    """

    def __init__(
        self,
        hardware: HardwareAPI,
        state_store: Optional[StateStore] = None,
        executor: Optional[CommandExecutor] = None,
    ):
        """Initialize a ProtocolEngine instance."""
        self.state_store: StateStore = (
            state_store if state_store is not None else StateStore()
        )
        self.executor: CommandExecutor = (
            executor if executor is not None else CommandExecutor(hardware)
        )

    async def execute_command(
        self,
        request: CommandRequestType,
        uid: str,
    ) -> Union[CompletedCommandType, FailedCommandType]:
        """Handle a command request by creating and executing the command."""
        created_at = utc_now()
        cmd: RunningCommandType = RunningCommand(  # type: ignore[assignment]
            created_at=created_at,
            started_at=created_at,
            request=request,
        )

        self.state_store.handle_command(cmd, uid=uid)
        completed_cmd = await self.executor.execute_command(
            cmd,
            state=self.state_store.state
        )
        self.state_store.handle_command(completed_cmd, uid=uid)

        return completed_cmd
