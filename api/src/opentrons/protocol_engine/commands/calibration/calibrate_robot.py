"""Blow-out command request, result, and implementation models."""
from __future__ import annotations
from typing import Optional, Type, List, cast
from typing_extensions import Literal
from pydantic import BaseModel, Field

from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)
from ...errors import ErrorOccurrence

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
        # print(isinstance(hardware_api, OT3API))
        # if not isinstance(hardware_api, OT3API):
        #     raise ValueError("This command is supported by OT3 Only.")

        self._hardware_api = hardware_api

    async def execute(self, params: CalibrateRobotParams) -> CalibrateRobotResult:
        """Execute calibrate-robot command."""
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
