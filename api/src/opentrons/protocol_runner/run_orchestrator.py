from __future__ import annotations
from typing import Optional, Union

from . import protocol_runner
from ..hardware_control import HardwareControlAPI
from ..protocol_engine import (
    ProtocolEngine,
    Command,
    CommandCreate,
    CommandIntent,
)
from ..protocol_engine.errors import CommandNotAllowedError
from ..protocol_engine.types import PostRunHardwareState
from ..protocol_reader import JsonProtocolConfig, PythonProtocolConfig


class RunOrchestrator:
    _json_or_python_runner: Optional[
        protocol_runner.AnyRunner
    ]  # I want to use type, should I just add a type ignore?
    _setup_runner: protocol_runner.AnyRunner
    _fixit_runner: protocol_runner.AnyRunner
    _hardware_api: HardwareControlAPI
    _protocol_engine: ProtocolEngine

    def __init__(
        self,
        run_id: Optional[str],
        protocol_engine: ProtocolEngine,
        hardware_api: HardwareControlAPI,
        fixit_runner: protocol_runner.AnyRunner,
        setup_runner: protocol_runner.AnyRunner,
        json_or_python_protocol_runner: Optional[protocol_runner.AnyRunner] = None,
    ):
        self.run_id: str
        self._protocol_engine = protocol_engine
        self._hardware_api = hardware_api
        self._json_or_python_runner = json_or_python_protocol_runner
        self._setup_runner = setup_runner
        self._fixit_runner = fixit_runner

    @classmethod
    def build_orchestrator(
        cls,
        run_id:Optional[str],
        protocol_engine: ProtocolEngine,
        hardware_api: HardwareControlAPI,
        protocol_config: Optional[
            Union[JsonProtocolConfig, PythonProtocolConfig]
        ] = None,
        post_run_hardware_state: PostRunHardwareState = PostRunHardwareState.HOME_AND_STAY_ENGAGED,
        drop_tips_after_run: bool = True,
    ) -> "RunOrchestrator":
        setup_runner = protocol_runner.create_protocol_runner(
            protocol_engine=protocol_engine,
            hardware_api=hardware_api,
            post_run_hardware_state=post_run_hardware_state,
            drop_tips_after_run=drop_tips_after_run,
        )
        fixit_runner = protocol_runner.create_protocol_runner(
            protocol_engine=protocol_engine,
            hardware_api=hardware_api,
            post_run_hardware_state=post_run_hardware_state,
            drop_tips_after_run=drop_tips_after_run,
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

    def add_command(
        self, request: CommandCreate, failed_command_id: Optional[str] = None
    ) -> CommandCreate:
        """Add a command to the queue.

        Arguments:
            request: The command type and payload data used to construct
                the command in state.
            failed_command_id: the failed command id this command is trying to fix.

        Returns:
            The full, newly queued command.

        Raises:
            SetupCommandNotAllowed: the request specified a setup command,
                but the engine was not idle or paused.
            RunStoppedError: the run has been stopped, so no new commands
                may be added.
            CommandNotAllowedError: the request specified a failed command id
                with a non fixit command.
        """
        if failed_command_id and request.intent != CommandIntent.FIXIT:
            raise CommandNotAllowedError(
                "failed command id should be supplied with a FIXIT command."
            )

        # pass the failed_command_id somewhere
        if request.intent == CommandIntent.SETUP:
            return self._setup_runner.set_command_queued(request)
        elif request.intent == CommandIntent.FIXIT:
            return self._fixit_runner.set_command_queued(request)
        elif (
            request.intent == CommandIntent.PROTOCOL
            and self._json_or_python_runner is not None
        ):
            return self._json_or_python_runner.set_command_queued(request)

    def get_protocol_runner(self) -> Optional[Union[protocol_runner.JsonRunner, protocol_runner.PythonAndLegacyRunner]]:
        return self._json_or_python_runner

    def get_protocol_engine(self) -> ProtocolEngine:
        return self._protocol_engine

