"""Calibrate-pipette command for OT3 hardware. request, result, and implementation models."""
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

CalibratePipetteCommandType = Literal["calibration/calibratePipette"]


class CalibratePipetteParams(BaseModel):
    """Payload required to calibrate-pipette."""

    mount: OT3Mount = Field(..., description="Instrument mount to calibrate.")


class CalibratePipetteResult(BaseModel):
    """Result data from the execution of a calibrate-pipette command."""

    pipetteOffset: Point = Field(..., description="Offset of calibrated pipette.")


class CalibratePipetteImplementation(
    AbstractCommandImpl[CalibratePipetteParams, CalibratePipetteResult]
):
    """CalibratePipette command implementation."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        **kwargs: object,
    ) -> None:
        self._hardware_api = hardware_api

    async def execute(self, params: CalibratePipetteParams) -> CalibratePipetteResult:
        """Execute calibrate-pipette command."""
        ensure_ot3_hardware(self._hardware_api)

        pipette_offset = await calibration.calibrate_mount(
            hcapi=self._hardware_api, mount=params.mount
        )

        return CalibratePipetteResult(pipetteOffset=pipette_offset)


class CalibratePipette(BaseCommand[CalibratePipetteParams, CalibratePipetteResult]):
    """Calibrate-pipette command model."""

    commandType: CalibratePipetteCommandType = "calibration/calibratePipette"
    params: CalibratePipetteParams
    result: Optional[CalibratePipetteResult]

    _ImplementationCls: Type[
        CalibratePipetteImplementation
    ] = CalibratePipetteImplementation


class CalibratePipetteCreate(BaseCommandCreate[CalibratePipetteParams]):
    """Create calibrate-pipette command request model."""

    commandType: CalibratePipetteCommandType = "calibration/calibratePipette"
    params: CalibratePipetteParams

    _CommandCls: Type[CalibratePipette] = CalibratePipette
