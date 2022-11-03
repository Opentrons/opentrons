import typing
from dataclasses import dataclass
from datetime import datetime
from opentrons.config import feature_flags as ff
from opentrons.config.robot_configs import (
    default_pipette_offset,
    default_gripper_calibration_offset,
)
from opentrons.types import Point
from opentrons.calibration_storage import (
    types as cal_top_types,
    get_pipette_offset,
    ot3_gripper_offset,
)
from opentrons.hardware_control.types import OT3Mount


@dataclass
class PipetteOffsetByPipetteMount:
    """
    Class to store pipette offset without pipette and mount info
    """

    offset: Point
    source: cal_top_types.SourceType
    status: cal_top_types.CalibrationStatus
    last_modified: typing.Optional[datetime] = None


@dataclass
class GripperCalibrationOffset:
    """
    Class to store gripper offset calibration with gripper info

        TODO(lc 09/15/2022) this can probably be combined with
        pipette offset mount.
    """

    offset: Point
    source: cal_top_types.SourceType
    status: cal_top_types.CalibrationStatus
    last_modified: typing.Optional[datetime] = None


def load_pipette_offset(
    pip_id: typing.Optional[str], mount: OT3Mount
) -> PipetteOffsetByPipetteMount:
    # load default if pipette offset data do not exist
    pip_cal_obj = PipetteOffsetByPipetteMount(
        offset=Point(*default_pipette_offset()),
        source=cal_top_types.SourceType.default,
        status=cal_top_types.CalibrationStatus(),
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
                status=cal_top_types.CalibrationStatus(
                    markedAt=pip_offset_data.status.markedAt,
                    markedBad=pip_offset_data.status.markedBad,
                    source=pip_offset_data.status.source,
                ),
            )
    return pip_cal_obj


def load_gripper_calibration_offset(
    gripper_id: typing.Optional[str],
) -> GripperCalibrationOffset:
    # load default if gripper offset data do not exist
    grip_cal_obj = GripperCalibrationOffset(
        offset=Point(*default_gripper_calibration_offset()),
        source=cal_top_types.SourceType.default,
        status=cal_top_types.CalibrationStatus(),
    )
    if gripper_id and ff.enable_ot3_hardware_controller():
        grip_offset_data = ot3_gripper_offset.get_gripper_calibration_offset(gripper_id)
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
