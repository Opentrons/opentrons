"""Models and implementation for the calibrateGripper command."""


from enum import Enum
from typing import Optional, Type
from typing_extensions import Literal

from pydantic import BaseModel, Field

from opentrons.hardware_control import HardwareControlAPI, ot3_calibration
from opentrons.hardware_control.types import GripperProbe as HWAPIGripperProbe

from opentrons.protocol_engine.commands.command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)
from opentrons.protocol_engine.types import Vec3f
from opentrons.protocol_engine.resources import ensure_ot3_hardware


CalibrateGripperCommandType = Literal["calibration/calibrateGripper"]


class CalibrateGripperParamsProbe(Enum):  # noqa: D101
    FRONT = "front"
    REAR = "rear"


class CalibrateGripperParams(BaseModel):
    """Parameters for a `calibrateGripper` command."""

    probe: CalibrateGripperParamsProbe = Field(
        ...,
        description=(
            "Which of the gripper's probes to use to measure its offset."
            " The robot will assume that a human operator has already attached"
            " this probe and removed the other probe, if there was one."
        ),
    )


class CalibrateGripperResult(BaseModel):
    """The result of a successful `calibrateGripper` command."""

    probeOffset: Vec3f = Field(
        ...,
        description=(
            "The offset from the probe's nominal position"
            " to its actual measured position."
        ),
    )


class CalibrateGripperImplementation(
    AbstractCommandImpl[CalibrateGripperParams, CalibrateGripperResult]
):
    """The implementation of a `calibrateGripper` command."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        *args: object,
        **kwargs: object,
    ) -> None:
        self._hardware_api = hardware_api

    async def execute(self, params: CalibrateGripperParams) -> CalibrateGripperResult:
        ot3_hardware_api = ensure_ot3_hardware(self._hardware_api)
        result = await ot3_calibration.calibrate_gripper(
            ot3_hardware_api, self._params_probe_to_hw_api_probe(params.probe)
        )
        return CalibrateGripperResult.construct(
            probeOffset=Vec3f.construct(x=result.x, y=result.y, z=result.z)
        )

    @staticmethod
    def _params_probe_to_hw_api_probe(
        from_params: CalibrateGripperParamsProbe,
    ) -> HWAPIGripperProbe:
        if from_params is CalibrateGripperParamsProbe.FRONT:
            return HWAPIGripperProbe.FRONT
        elif from_params is CalibrateGripperParamsProbe.REAR:
            return HWAPIGripperProbe.REAR
        # No `else`, so mypy will check for exhaustiveness.


class CalibrateGripper(BaseCommand[CalibrateGripperParams, CalibrateGripperResult]):
    """A `calibrateGripper` command."""

    commandType: CalibrateGripperCommandType = "calibration/calibrateGripper"
    params: CalibrateGripperParams
    result: Optional[CalibrateGripperResult]

    _ImplementationCls: Type[
        CalibrateGripperImplementation
    ] = CalibrateGripperImplementation


class CalibrateGripperCreate(BaseCommandCreate[CalibrateGripperParams]):
    """A request to create a `calibrateGripper` command."""

    commandType: CalibrateGripperCommandType = "calibration/calibrateGripper"
    params: CalibrateGripperParams

    _CommandCls: Type[CalibrateGripper] = CalibrateGripper
