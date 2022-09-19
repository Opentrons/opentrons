import typing
from typing_extensions import Literal
from dataclasses import dataclass
from datetime import datetime
from opentrons.config import feature_flags as ff
from opentrons.config.robot_configs import (
    default_pipette_offset,
    default_gripper_calibration_offset,
)
from opentrons.types import Mount
from opentrons.calibration_storage import types
from opentrons.hardware_control.types import OT3Mount
from opentrons.calibration_storage.ot3 import get

from opentrons_shared_data.pipette.dev_types import LabwareUri

@dataclass
class PipetteOffsetByPipetteMount:
    """
    Class to store pipette offset without pipette and mount info
    """

    offset: types.InstrumentCalOffset
    source: types.SourceType
    status: types.CalibrationStatus
    last_modified: typing.Optional[datetime] = None


@dataclass
class GripperCalibrationOffset:
    """
    Class to store gripper offset calibration with gripper info

	TODO(lc 09/15/2022) this can probably be combined with
	pipette offset mount.
    """

    offset: types.InstrumentCalOffset
    source: types.SourceType
    status: types.CalibrationStatus
    last_modified: typing.Optional[datetime] = None


@dataclass
class TipLengthCalibration:
    tip_length: float
    source: types.SourceType
    status: types.CalibrationStatus
    pipette: str
    tiprack: str
    last_modified: datetime
    uri: typing.Union[LabwareUri, Literal[""]]


def load_pipette_offset(
    pip_id: typing.Optional[str], mount: OT3Mount
) -> PipetteOffsetByPipetteMount:
    # load default if pipette offset data do not exist
    pip_cal_obj = PipetteOffsetByPipetteMount(
        offset=default_pipette_offset(),
        source=types.SourceType.default,
        status=types.CalibrationStatus(),
    )
	# TODO this can be removed once we switch to using
    # ot3 pipette types in the ot3 hardware controller.
    if isinstance(mount, OT3Mount):
        checked_mount = mount.to_mount()
    else:
        checked_mount = mount
    if pip_id:
        pip_offset_data = get.get_pipette_offset(pip_id, checked_mount)
        if pip_offset_data:
            return PipetteOffsetByPipetteMount(**pip_offset_data.dict())
    return pip_cal_obj


def load_gripper_calibration_offset(
    gripper_id: typing.Optional[str],
) -> GripperCalibrationOffset:
    # load default if gripper offset data do not exist
    grip_cal_obj = GripperCalibrationOffset(
        offset=default_gripper_calibration_offset(),
        source=types.SourceType.default,
        status=types.CalibrationStatus(),
    )
    if gripper_id and ff.enable_ot3_hardware_controller():
        grip_offset_data = get.get_gripper_calibration_offset(gripper_id)
        if grip_offset_data:
            return GripperCalibrationOffset(**grip_offset_data)
    return grip_cal_obj


def load_tip_length_for_pipette(pipette_id: str, tiprack: LabwareUri) -> TipLengthCalibration:
    try:
        tip_length_data = get.load_tip_length_calibration(pipette_id, tiprack)
        return TipLengthCalibration(**tip_length_data.dict())
    except types.TipLengthCalNotFound:
        raise types.TipLengthCalNotFound()
