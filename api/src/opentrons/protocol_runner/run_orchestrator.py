"""Engine/Runner provider."""
from __future__ import annotations
from typing import Optional, Union

from . import protocol_runner, AnyRunner
from ..hardware_control import HardwareControlAPI
from ..protocol_engine import ProtocolEngine
from ..protocol_engine.types import PostRunHardwareState
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

    @property
    def engine(self) -> ProtocolEngine:
        """Get the "current" persisted ProtocolEngine."""
        return self._protocol_engine

    @property
    def runner(self) -> AnyRunner:
        """Get the "current" persisted ProtocolRunner."""
        return self._protocol_runner or self._setup_runner

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
