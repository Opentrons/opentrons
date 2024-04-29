from typing import Optional, Union

from .protocol_runner import create_protocol_runner, AnyRunner
from ..hardware_control import HardwareControlAPI
from ..protocol_engine import ProtocolEngine
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
