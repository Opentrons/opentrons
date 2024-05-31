"""Engine/Runner provider."""
from __future__ import annotations
from typing import Optional, Union, List, Dict

from anyio import move_on_after

from build.lib.opentrons_shared_data.labware.dev_types import LabwareUri
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from . import protocol_runner, RunResult
from ..hardware_control import HardwareControlAPI
from ..hardware_control.modules import AbstractModule as HardwareModuleAPI
from ..protocol_engine import ProtocolEngine, CommandCreate, Command, StateSummary, CommandPointer, CommandSlice
from ..protocol_engine.types import PostRunHardwareState, EngineStatus, LabwareOffsetCreate, LabwareOffset, \
    DeckConfigurationType, RunTimeParameter
from ..protocol_reader import JsonProtocolConfig, PythonProtocolConfig


class RunOrchestrator:
    """Provider for runners and associated protocol engine.

    Build runners, manage command execution, run state and in-memory protocol engine associated to the runners.
    """

    _protocol_runner: Optional[
        Union[protocol_runner.JsonRunner, protocol_runner.PythonAndLegacyRunner, None]
    ]
    _setup_runner: protocol_runner.LiveRunner
    _fixit_runner: protocol_runner.LiveRunner
    _protocol_live_runner: protocol_runner.LiveRunner
    _hardware_api: HardwareControlAPI
    _protocol_engine: ProtocolEngine

    def __init__(
            self,
            protocol_engine: ProtocolEngine,
            hardware_api: HardwareControlAPI,
            fixit_runner: protocol_runner.LiveRunner,
            setup_runner: protocol_runner.LiveRunner,
            json_or_python_protocol_runner: Optional[
                Union[protocol_runner.PythonAndLegacyRunner, protocol_runner.JsonRunner]
            ] = None,
            run_id: Optional[str] = None,
    ) -> None:
        """Initialize a run orchestrator interface.

        Arguments:
            protocol_engine: Protocol engine instance.
            hardware_api: Hardware control API instance.
            fixit_runner: LiveRunner for fixit commands.
            setup_runner: LiveRunner for setup commands.
            json_or_python_protocol_runner: JsonRunner/PythonAndLegacyRunner for protocol commands.
            run_id: run id if any, associated to the runner/engine.
        """
        self.run_id = run_id
        self._protocol_engine = protocol_engine
        self._hardware_api = hardware_api
        self._protocol_runner = json_or_python_protocol_runner
        self._setup_runner = setup_runner
        self._fixit_runner = fixit_runner

    # @property
    # def engine(self) -> ProtocolEngine:
    #     """Get the "current" persisted ProtocolEngine."""
    #     return self._protocol_engine
    #
    # @property
    # def runner(self) -> AnyRunner:
    #     """Get the "current" persisted ProtocolRunner."""
    #     return self._protocol_runner or self._setup_runner

    @classmethod
    def build_orchestrator(
            cls,
            protocol_engine: ProtocolEngine,
            hardware_api: HardwareControlAPI,
            protocol_config: Optional[
                Union[JsonProtocolConfig, PythonProtocolConfig]
            ] = None,
            post_run_hardware_state: PostRunHardwareState = PostRunHardwareState.HOME_AND_STAY_ENGAGED,
            drop_tips_after_run: bool = True,
            run_id: Optional[str] = None,
    ) -> "RunOrchestrator":
        """Build a RunOrchestrator provider."""
        setup_runner = protocol_runner.LiveRunner(
            protocol_engine=protocol_engine,
            hardware_api=hardware_api,
        )
        fixit_runner = protocol_runner.LiveRunner(
            protocol_engine=protocol_engine,
            hardware_api=hardware_api,
        )
        json_or_python_runner = None
        if protocol_config:
            json_or_python_runner = protocol_runner.create_protocol_runner(
                protocol_config=protocol_config,
                protocol_engine=protocol_engine,
                hardware_api=hardware_api,
                post_run_hardware_state=post_run_hardware_state,
                drop_tips_after_run=drop_tips_after_run,
            )
        return cls(
            run_id=run_id,
            json_or_python_protocol_runner=json_or_python_runner,
            setup_runner=setup_runner,
            fixit_runner=fixit_runner,
            hardware_api=hardware_api,
            protocol_engine=protocol_engine,
        )

    def play(self, deck_configuration: Optional[DeckConfigurationType] = None) -> None:
        """Start or resume the run."""
        self._protocol_engine.play(deck_configuration=deck_configuration)

    async def run(self, deck_configuration: DeckConfigurationType) -> RunResult:
        """Start or resume the run."""
        # TODO(tz, 5-31-2024): call all runners?
        return await self._protocol_runner.run(
            deck_configuration=deck_configuration
        )

    def pause(self) -> None:
        """Start or resume the run."""
        self._protocol_engine.request_pause()

    async def stop(self) -> None:
        """Start or resume the run."""
        if self.run_has_started():
            await self.run_orchestrator.runner.stop()
        else:
            self.finish(
                drop_tips_after_run=False,
                set_run_status=False,
                post_run_hardware_state=PostRunHardwareState.STAY_ENGAGED_IN_PLACE,
            )

    def resume_from_recovery(self) -> None:
        """Start or resume the run."""
        self._protocol_engine.resume_from_recovery()

    async def finish(self, error: Optional[Exception]) -> None:
        """Stop the run."""
        await self._protocol_engine.finish(error=error)

    def get_state_summary(self) -> StateSummary:
        return self._protocol_engine.state_view.get_summary()

    def get_loaded_labware_definitions(self) -> List[LabwareDefinition]:
        return (
            self._protocol_engine.state_view.labware.get_loaded_labware_definitions()
        )

    def get_run_time_parameters(self) -> List[RunTimeParameter]:
        """Parameter definitions defined by protocol, if any. Will always be empty before execution."""
        return [] if self._protocol_runner is None else self._protocol_runner.run_time_parameters

    def get_current_command(self) -> Optional[CommandPointer]:
        """Parameter definitions defined by protocol, if any. Will always be empty before execution."""
        return self._protocol_engine.state_view.commands.get_current()

    def get_command_slice(
            self,
            cursor: Optional[int],
            length: int,
    ) -> CommandSlice:
        """Get a slice of run commands.

        Args:
            run_id: ID of the run.
            cursor: Requested index of first command in the returned slice.
            length: Length of slice to return.

        Raises:
            RunNotFoundError: The given run identifier was not found in the database.
        """
        return self._protocol_engine.state_view.commands.get_slice(
            cursor=cursor, length=length
        )

    def get_command_recovery_target(self) -> Optional[CommandPointer]:
        """Get the current error recovery target."""
        return self._protocol_engine.state_view.commands.get_recovery_target()

    def get_command(self, command_id: str) -> Command:
        """Get a run's command by ID."""
        return self._protocol_engine.state_view.commands.get(
            command_id=command_id
        )

    def get_run_status(self) -> EngineStatus:
        """Get the current execution status of the engine."""
        return self._protocol_engine.state_view.commands.get_status()

    def get_is_run_terminal(self) -> bool:
        return self._protocol_engine.state_view.commands.get_is_terminal()

    def run_has_started(self) -> bool:
        return self._protocol_engine.state_view.commands.has_been_played()

    def run_has_stopped(self) -> bool:
        return self._protocol_engine.state_view.commands.get_is_stopped()

    def add_labware_offset(self, request: LabwareOffsetCreate) -> LabwareOffset:
        return self._protocol_engine.add_labware_offset(request)

    def add_labware_definition(self, definition: LabwareDefinition) -> LabwareUri:
        return self.run_orchestrator.engine.add_labware_definition(definition)

    async def add_command_and_wait_for_interval(self, command: CommandCreate, wait_until_complete: bool = False,
                                                timeout: Optional[int] = None,
                                                failed_command_id: Optional[str] = None) -> Command:
        added_command = self._protocol_engine.add_command(request=command, failed_command_id=failed_command_id)
        if wait_until_complete:
            timeout_sec = None if timeout is None else timeout / 1000.0
            with move_on_after(timeout_sec):
                await self._protocol_engine.wait_for_command(added_command.id)
        return added_command

    def estop(self) -> None:
        return self._protocol_engine.estop()

    async def use_attached_modules(self, modules_by_id: Dict[str, HardwareModuleAPI]) -> None:
        await self._protocol_engine.use_attached_modules(modules_by_id=modules_by_id)

    def get_protocol_runner(self) -> None:
        raise NotImplementedError()