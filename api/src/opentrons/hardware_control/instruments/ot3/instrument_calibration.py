import typing
from typing_extensions import Literal, Final
from dataclasses import dataclass, field
from datetime import datetime

from opentrons.config import feature_flags as ff
from opentrons.config.robot_configs import (
    default_pipette_offset,
    default_gripper_calibration_offset,
)
from opentrons.types import Point, Mount

# TODO change this when imports are fixed
from opentrons.calibration_storage.ot3.pipette_offset import (
    save_pipette_calibration,
    get_pipette_offset,
)
from opentrons.calibration_storage import (
    types as cal_top_types,
    gripper_offset,
)
from opentrons.hardware_control.types import OT3Mount

PIPETTE_OFFSET_CONSISTENCY_LIMIT: Final = 4.0

# These type aliases aid typechecking in tests that work the same on this and
# the hardware_control.instruments.ot2 variant
SourceType = cal_top_types.SourceType
CalibrationStatus = cal_top_types.CalibrationStatus


@dataclass
class InconsistentPipetteOffsets:
    kind: Literal["inconsistent-pipette-offset"]
    offsets: typing.Dict[Mount, Point]
    limit: float


ReasonabilityCheckFailure = typing.Union[InconsistentPipetteOffsets]


@dataclass
class PipetteOffsetByPipetteMount:
    """
    Class to store pipette offset without pipette and mount info
    """

    offset: Point
    source: SourceType
    status: CalibrationStatus
    last_modified: typing.Optional[datetime] = None


@dataclass
class PipetteOffsetSummary(PipetteOffsetByPipetteMount):
    reasonability_check_failures: typing.List[ReasonabilityCheckFailure] = field(
        default_factory=list
    )


@dataclass
class GripperCalibrationOffset:
    """
    Class to store gripper offset calibration with gripper info

    TODO(lc 09/15/2022) this can probably be combined with
    pipette offset mount.
    """

    offset: Point
    source: SourceType
    status: CalibrationStatus
    last_modified: typing.Optional[datetime] = None


def load_pipette_offset(
    pip_id: typing.Optional[str], mount: OT3Mount
) -> PipetteOffsetByPipetteMount:
    # load default if pipette offset data do not exist
    pip_cal_obj = PipetteOffsetByPipetteMount(
        offset=Point(*default_pipette_offset()),
        source=SourceType.default,
        status=CalibrationStatus(),
    )
    # TODO this can be removed once we switch to using
    # ot3 pipette types in the ot3 hardware controller.
    if isinstance(mount, OT3Mount):
        checked_mount = mount.to_mount()
    else:
        checked_mount = mount
    if pip_id:
        pip_offset_data = get_pipette_offset(pip_id, checked_mount)
        if pip_offset_data:
            return PipetteOffsetByPipetteMount(
                offset=pip_offset_data.offset,
                last_modified=pip_offset_data.lastModified,
                source=pip_offset_data.source,
                status=CalibrationStatus(
                    markedAt=pip_offset_data.status.markedAt,
                    markedBad=pip_offset_data.status.markedBad,
                    source=pip_offset_data.status.source,
                ),
            )
    return pip_cal_obj


def save_pipette_offset_calibration(
    pip_id: typing.Optional[str], mount: typing.Union[Mount, OT3Mount], offset: Point
) -> None:
    # TODO this can be removed once we switch to using
    # ot3 pipette types in the ot3 hardware controller.
    if isinstance(mount, OT3Mount):
        checked_mount = mount.to_mount()
    else:
        checked_mount = mount
    if pip_id:
        save_pipette_calibration(offset, pip_id, checked_mount)


def load_gripper_calibration_offset(
    gripper_id: typing.Optional[str],
) -> GripperCalibrationOffset:
    # load default if gripper offset data do not exist
    grip_cal_obj = GripperCalibrationOffset(
        offset=Point(*default_gripper_calibration_offset()),
        source=SourceType.default,
        status=CalibrationStatus(),
    )
    if gripper_id and ff.enable_ot3_hardware_controller():
        grip_offset_data = gripper_offset.get_gripper_calibration_offset(gripper_id)
        if grip_offset_data:
            return GripperCalibrationOffset(
                offset=grip_offset_data.offset,
                last_modified=grip_offset_data.lastModified,
                source=grip_offset_data.source,
                status=cal_top_types.CalibrationStatus(
                    markedAt=grip_offset_data.status.markedAt,
                    markedBad=grip_offset_data.status.markedBad,
                    source=grip_offset_data.status.source,
                ),
            )
    return grip_cal_obj


def save_gripper_calibration_offset(
    gripper_id: typing.Optional[str], delta: Point
) -> None:
    if gripper_id and ff.enable_ot3_hardware_controller():
        gripper_offset.save_gripper_calibration(delta, gripper_id)


def check_instrument_offset_reasonability(
    left_offset: Point, right_offset: Point
) -> typing.List[ReasonabilityCheckFailure]:
    if (
        not left_offset
        or left_offset == Point(0, 0, 0)
        or not right_offset
        or right_offset == Point(0, 0, 0)
    ):
        return []
    diff = left_offset - right_offset
    if any(abs(d) > PIPETTE_OFFSET_CONSISTENCY_LIMIT for d in diff):
        return [
            InconsistentPipetteOffsets(
                "inconsistent-pipette-offset",
                {Mount.LEFT: left_offset, Mount.RIGHT: right_offset},
                PIPETTE_OFFSET_CONSISTENCY_LIMIT,
            )
        ]
    return []
