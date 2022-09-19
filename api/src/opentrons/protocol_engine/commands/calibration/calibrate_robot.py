"""Calibrate-robot command for OT3 hardware. request, result, and implementation models."""
from __future__ import annotations

from typing import Optional, Type, List
from typing_extensions import Literal
from pydantic import BaseModel, Field

from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)
from ...errors import ErrorOccurrence
from ...validation import ensure_ot3_hardware

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control import ot3_calibration as calibration
from opentrons.hardware_control.types import OT3Mount
from opentrons.types import Point
from opentrons.hardware_control.ot3api import OT3API

CalibrateRobotCommandType = Literal["calibrateRobot"]


class CalibrateRobotParams(BaseModel):
    """Payload required to calibrate-robot."""

    mount: OT3Mount = Field(..., description="Instrument mount to calibrate.")


class CalibrateRobotResult(BaseModel):
    """Result data from the execution of a calibrate-robot command."""

    pipetteOffset: Point = Field(
        ..., description="Pipette offset of calibrated pipette."
    )
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
        ensure_ot3_hardware(self._hardware_api)

        pipette_offset = await calibration.calibrate_mount(
            hcapi=self._hardware_api, mount=params.mount
        )

        return CalibrateRobotResult(pipetteOffset=pipette_offset)


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
