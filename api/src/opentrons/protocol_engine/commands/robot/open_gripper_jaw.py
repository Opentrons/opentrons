"""Command models for opening a gripper jaw."""

from __future__ import annotations
from typing import Literal, Type, Optional, TYPE_CHECKING
from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.resources import ensure_ot3_hardware

from pydantic import BaseModel

from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
)
from opentrons.protocol_engine.errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from ...state.state import StateView


OpenGripperJawCommandType = Literal["robot/openGripperJaw"]


class OpenGripperJawParams(BaseModel):
    """Payload required to release a gripper."""

    pass


class OpenGripperJawResult(BaseModel):
    """Result data from the execution of a openGripperJaw command."""

    pass


class OpenGripperJawImplementation(
    AbstractCommandImpl[OpenGripperJawParams, SuccessData[OpenGripperJawResult]]
):
    """openGripperJaw command implementation."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        state_view: StateView,
        **kwargs: object,
    ) -> None:
        self._hardware_api = hardware_api
        self._state_view = state_view

    async def execute(
        self, params: OpenGripperJawParams
    ) -> SuccessData[OpenGripperJawResult]:
        """Release the gripper."""
        if self._state_view.config.use_virtual_gripper:
            return SuccessData(public=OpenGripperJawResult())

        ot3_hardware_api = ensure_ot3_hardware(self._hardware_api)

        await ot3_hardware_api.home_gripper_jaw()
        return SuccessData(
            public=OpenGripperJawResult(),
        )


class OpenGripperJaw(
    BaseCommand[OpenGripperJawParams, OpenGripperJawResult, ErrorOccurrence]
):
    """openGripperJaw command model."""

    commandType: OpenGripperJawCommandType = "robot/openGripperJaw"
    params: OpenGripperJawParams
    result: Optional[OpenGripperJawResult] = None

    _ImplementationCls: Type[
        OpenGripperJawImplementation
    ] = OpenGripperJawImplementation


class OpenGripperJawCreate(BaseCommandCreate[OpenGripperJawParams]):
    """openGripperJaw command request model."""

    commandType: OpenGripperJawCommandType = "robot/openGripperJaw"
    params: OpenGripperJawParams

    _CommandCls: Type[OpenGripperJaw] = OpenGripperJaw
