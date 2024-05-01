from typing import Optional, Union

from .protocol_runner import create_protocol_runner, AnyRunner
from ..hardware_control import HardwareControlAPI
from ..protocol_engine import (
    ProtocolEngine,
    Command,
    CommandCreate,
    CommandIntent,
    slot_standardization,
)
from ..protocol_engine.commands import hash_command_params
from ..protocol_engine.errors import CommandNotAllowedError
from ..protocol_engine.types import PostRunHardwareState
from ..protocol_reader import JsonProtocolConfig, PythonProtocolConfig


class RunOrchestrator:
    _protocol_runner: AnyRunner
    _setup_runner: AnyRunner
    _fixit_runner: AnyRunner

    def __init__(
        self,
        protocol_config: Optional[Union[JsonProtocolConfig, PythonProtocolConfig]],
        protocol_engine: ProtocolEngine,
        hardware_api: HardwareControlAPI,
        post_run_hardware_state: PostRunHardwareState = PostRunHardwareState.HOME_AND_STAY_ENGAGED,
        drop_tips_after_run: bool = True,
    ) -> None:
        self._protocol_engine = protocol_engine
        self._hardware_api = hardware_api
        self._post_run_hardware_state = post_run_hardware_state
        self._drop_tips_after_run = drop_tips_after_run
        self._setup_runner = create_protocol_runner(
            protocol_engine=protocol_engine,
            hardware_api=hardware_api,
            post_run_hardware_state=post_run_hardware_state,
            drop_tips_after_run=drop_tips_after_run,
        )
        self._fixit_runner = create_protocol_runner(
            protocol_engine=protocol_engine,
            hardware_api=hardware_api,
            post_run_hardware_state=post_run_hardware_state,
            drop_tips_after_run=drop_tips_after_run,
        )

        if protocol_config:
            self._protocol_runner = create_protocol_runner(
                protocol_config=protocol_config,
                protocol_engine=protocol_engine,
                hardware_api=hardware_api,
                post_run_hardware_state=post_run_hardware_state,
                drop_tips_after_run=drop_tips_after_run,
            )

    def add_command(
        self, request: CommandCreate, failed_command_id: Optional[str] = None
    ) -> Command:
        """Add a command to the queue.

        Arguments:
            request: The command type and payload data used to construct
                the command in state.

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
            self._setup_runner.set_command_queued(request)
        elif request.intent == CommandIntent.FIXIT:
            self._fixit_runner.set_command_queued(request)
        else:
            # dont really need this bc we are looping in the runner
            self._protocol_runner.set_command_queued(request)
