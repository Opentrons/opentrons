"""Blow-out command request, result, and implementation models."""
from __future__ import annotations
from typing import Optional, Type, List
from typing_extensions import Literal
from pydantic import BaseModel, Field

from opentrons.types import Mount
from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    ErrorOccurrence,
)

from opentrons.hardware_control import HardwareControlAPI


CalibrateRobotCommandType = Literal["calibrateRobot"]


class CalibrateRobotParams(BaseModel):
    """Payload required to calibrate-robot."""

    # Should this be OT3Mount?
    mount: Mount = Field(..., description="Instrument mount to calibrate.")


class CalibrateRobotResult(BaseModel):
    """Result data from the execution of a calibrate-robot command."""

    # change type per axis
    offsets: List[float] = Field(..., description="Instrument calibration offsets.")
    errors: Optional[List[ErrorOccurrence]] = Field(
        default_factory=None, description="Errors raised from calibrate-robot command."
    )


class CalibrateRobotImplementation(
    AbstractCommandImpl[CalibrateRobotParams, CalibrateRobotResult]
):
    """CalibrateRobot command implementation."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        **kwargs: object,
    ) -> None:
        self._hardware_api = hardware_api

    async def execute(self, params: CalibrateRobotParams) -> CalibrateRobotResult:
        """Execute calibrate-robot command."""
        # result = await self._hardware_api.probe(mount=params.mount)

        return CalibrateRobotResult(offsets=[])


class CalibrateRobot(BaseCommand[CalibrateRobotParams, CalibrateRobotResult]):
    """Calibrate-robot command model."""

    commandType: CalibrateRobotCommandType = "calibrateRobot"
    params: CalibrateRobotParams
    result: Optional[CalibrateRobotResult]

    _ImplementationCls: Type[
        CalibrateRobotImplementation
    ] = CalibrateRobotImplementation


class CalibrateRobotCreate(BaseCommandCreate[CalibrateRobotParams]):
    """Create calibrate-robot command request model."""

    commandType: CalibrateRobotCommandType = "calibrateRobot"
    params: CalibrateRobotParams

    _CommandCls: Type[CalibrateRobot] = CalibrateRobot
