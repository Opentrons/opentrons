"""Models and implementation for the calibrateGripper command."""
from enum import Enum
from typing import Optional, Type
from typing_extensions import Literal

from pydantic import BaseModel, Field

from opentrons.types import Point
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control import ot3_calibration
from opentrons.hardware_control.types import OT3Mount, GripperProbe as HWAPIGripperProbe
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
    otherProbeOffset: Optional[Vec3f] = Field(
        None,
        description=(
            "If an offset for the other probe is already found, then specifying it here"
            " will enable the CalibrateGripper command to complete the calibration"
            " process by calculating the total offset and saving it to disk."
            " If this param is not specified then the command will only find and return"
            " the offset for the specified probe."
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
    gripperOffset: Optional[Vec3f] = Field(
        None,
        description=(
            "The total gripper offset calculated when `otherProbeOffset` is provided"
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
        """Execute a `calibrateGripper` command.

        1. Move from the current location to the calibration area on the deck.
        2. Using the given probe, sense the gripper's offset from its ideal position.
        3. Return the gripper's offset from its ideal position.
        """
        ot3_hardware_api = ensure_ot3_hardware(self._hardware_api)

        probe_offset = await ot3_calibration.calibrate_gripper(
            ot3_hardware_api, self._convert_to_hw_api_probe(params.probe)
        )
        other_probe_offset = params.otherProbeOffset
        total_offset: Optional[Point] = None
        if other_probe_offset is not None:
            total_offset = 0.5 * (
                probe_offset
                + Point(
                    x=other_probe_offset.x,
                    y=other_probe_offset.y,
                    z=other_probe_offset.z,
                )
            )
            await ot3_hardware_api.save_instrument_offset(
                mount=OT3Mount.GRIPPER, delta=total_offset
            )

        return CalibrateGripperResult.construct(
            probeOffset=Vec3f.construct(
                x=probe_offset.x, y=probe_offset.y, z=probe_offset.z
            ),
            gripperOffset=Vec3f.construct(
                x=total_offset.x, y=total_offset.y, z=total_offset.z
            )
            if total_offset
            else None,
        )

    @staticmethod
    def _convert_to_hw_api_probe(
        probe_from_params: CalibrateGripperParamsProbe,
    ) -> HWAPIGripperProbe:
        if probe_from_params is CalibrateGripperParamsProbe.FRONT:
            return HWAPIGripperProbe.FRONT
        elif probe_from_params is CalibrateGripperParamsProbe.REAR:
            return HWAPIGripperProbe.REAR


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
