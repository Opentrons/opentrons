"""Command models for opening a gripper jaw."""

from __future__ import annotations
from typing import Literal, Type, Optional, Any, TYPE_CHECKING

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.resources import ensure_ot3_hardware

from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
)
from opentrons.protocol_engine.errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from ...state.state import StateView


CloseGripperJawCommandType = Literal["robot/closeGripperJaw"]


def _remove_default(s: dict[str, Any]) -> None:
    s.pop("default", None)


class CloseGripperJawParams(BaseModel):
    """Payload required to close a gripper."""

    force: float | SkipJsonSchema[None] = Field(
        default=None,
        description="The force the gripper should use to hold the jaws, falls to default if none is provided.",
        json_schema_extra=_remove_default,
    )


class CloseGripperJawResult(BaseModel):
    """Result data from the execution of a CloseGripperJaw command."""

    pass


class CloseGripperJawImplementation(
    AbstractCommandImpl[CloseGripperJawParams, SuccessData[CloseGripperJawResult]]
):
    """CloseGripperJaw command implementation."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        state_view: StateView,
        **kwargs: object,
    ) -> None:
        self._hardware_api = hardware_api
        self._state_view = state_view

    async def execute(
        self, params: CloseGripperJawParams
    ) -> SuccessData[CloseGripperJawResult]:
        """Release the gripper."""
        if self._state_view.config.use_virtual_gripper:
            return SuccessData(
                public=CloseGripperJawResult(),
            )
        ot3_hardware_api = ensure_ot3_hardware(self._hardware_api)
        await ot3_hardware_api.grip(force_newtons=params.force)
        return SuccessData(
            public=CloseGripperJawResult(),
        )


class CloseGripperJaw(
    BaseCommand[CloseGripperJawParams, CloseGripperJawResult, ErrorOccurrence]
):
    """CloseGripperJaw command model."""

    commandType: CloseGripperJawCommandType = "robot/closeGripperJaw"
    params: CloseGripperJawParams
    result: Optional[CloseGripperJawResult] = None

    _ImplementationCls: Type[
        CloseGripperJawImplementation
    ] = CloseGripperJawImplementation


class CloseGripperJawCreate(BaseCommandCreate[CloseGripperJawParams]):
    """CloseGripperJaw command request model."""

    commandType: CloseGripperJawCommandType = "robot/closeGripperJaw"
    params: CloseGripperJawParams

    _CommandCls: Type[CloseGripperJaw] = CloseGripperJaw
