from __future__ import annotations
from typing import Optional, Union

from . import protocol_runner
from ..hardware_control import HardwareControlAPI
from ..protocol_engine import ProtocolEngine
from ..protocol_engine.types import PostRunHardwareState
from ..protocol_reader import JsonProtocolConfig, PythonProtocolConfig


class RunOrchestrator:
    _json_or_python_runner: Optional[protocol_runner.AnyRunner]
    _setup_runner: protocol_runner.AnyRunner
    _fixit_runner: protocol_runner.AnyRunner
    _hardware_api: HardwareControlAPI
    _protocol_engine: ProtocolEngine

    def __init__(
        self,
        protocol_engine: ProtocolEngine,
        hardware_api: HardwareControlAPI,
        fixit_runner: protocol_runner.AnyRunner,
        setup_runner: protocol_runner.AnyRunner,
        json_or_python_protocol_runner: Optional[protocol_runner.AnyRunner] = None,
        run_id: Optional[str] = None,
    ):
        self.run_id = run_id
        self._protocol_engine = protocol_engine
        self._hardware_api = hardware_api
        self._json_or_python_runner = json_or_python_protocol_runner
        self._setup_runner = setup_runner
        self._fixit_runner = fixit_runner

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

    def get_protocol_runner(self) -> protocol_runner.AnyRunner:
        return self._json_or_python_runner or self._setup_runner

    def get_protocol_engine(self) -> ProtocolEngine:
        return self._protocol_engine
