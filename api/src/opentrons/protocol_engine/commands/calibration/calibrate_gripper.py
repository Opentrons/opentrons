"""Models and implementation for the calibrateGripper command."""


from enum import Enum
from typing import Optional, Type
from typing_extensions import Literal

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate
from ...types import Vec3f


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
        )
    )


class CalibrateGripperResult(BaseModel):
    """The result of a successful `calibrateGripper` command."""

    probeOffset: Vec3f = Field(
        ...,
        description=(
            "The offset from the probe's nominal position"
            " to its actual measured position."
        )
    )


class CalibrateGripperImplementation(
    AbstractCommandImpl[CalibrateGripperParams, CalibrateGripperResult]
):
    """The implementation of a `calibrateGripper` command."""

    async def execute(self, params: CalibrateGripperParams) -> CalibrateGripperResult:
        raise NotImplementedError()


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
