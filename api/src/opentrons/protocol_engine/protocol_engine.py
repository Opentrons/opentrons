"""
Protocol engine module.

The protocol_engine module contains the logic necessary to take a stream of
protocol commands, issued by some arbitrary protocol runner, and turn it into
robot actions (via `hardware_control`) and protocol state.
"""
from typing import Optional, Union

from opentrons.util.helpers import utc_now
from opentrons.hardware_control.api import API as HardwareAPI

from .execution import CommandExecutor
from .resources import IdGenerator
from .state import StateStore

from .command_models import (
    CommandRequestType,
    RunningCommandType,
    CompletedCommandType,
    FailedCommandType,
    RunningCommand
)


class ProtocolEngine():
    state_store: StateStore
    executor: CommandExecutor

    def __init__(
        self,
        hardware: HardwareAPI,
        state_store: Optional[StateStore] = None,
        executor: Optional[CommandExecutor] = None,
        id_generator: Optional[IdGenerator] = None,
    ):
        self.state_store = (
            state_store if state_store is not None else StateStore()
        )
        self._id_generator = (
            id_generator if id_generator is not None else IdGenerator()
        )
        self.executor = (
            executor if executor is not None else CommandExecutor(hardware)
        )

    async def execute_command(
        self,
        request: CommandRequestType
    ) -> Union[CompletedCommandType, FailedCommandType]:
        uid = self._id_generator.generate_id()
        created_at = utc_now()
        cmd: RunningCommandType = RunningCommand(  # type: ignore[assignment]
            uid=uid,
            createdAt=created_at,
            startedAt=created_at,
            request=request,
        )

        self.state_store.handle_command(cmd)
        completed_cmd = await self.executor.execute_command(
            cmd,
            state=self.state_store.state
        )
        self.state_store.handle_command(completed_cmd)

        return completed_cmd
