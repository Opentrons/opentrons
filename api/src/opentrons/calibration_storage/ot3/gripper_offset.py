import os
import json
from pydantic import ValidationError
from typing import Dict, cast, Optional

from opentrons import config, types
from dataclasses import asdict
from opentrons.util.helpers import utc_now


from .. import file_operators as io, types as local_types

from .schemas import v1


GripperCalibrations = Dict[local_types.GripperId, v1.InstrumentOffsetSchema]

# Gripper Offset Calibrations Look-Up

def _gripper_offset_calibrations() -> GripperCalibrations:
    gripper_calibration_dir = config.get_opentrons_path("gripper_calibration_dir")
    gripper_calibration_dict: GripperCalibrations = {}

    for file in os.scandir(gripper_calibration_dir):
        if file.is_file() and ".json" in file.name:
            gripper_id = cast(local_types.GripperId, file.name.split(".json")[0])
            try:
                gripper_calibration_dict[gripper_id] = v1.InstrumentOffsetSchema(
                    **io.read_cal_file(file.path)
                )
            except (json.JSONDecodeError, ValidationError):
                pass
    return gripper_calibration_dict

# Delete Gripper Offset Calibrations

def delete_gripper_calibration_file(gripper: local_types.GripperId) -> None:
    """
    Delete gripper calibration offset file based on gripper serial number

    :param gripper: gripper serial number
    """
    offset_path = (
        config.get_opentrons_path("gripper_calibration_dir") / f"{gripper}.json"
    )
    io._delete_file(offset_path)


def clear_gripper_calibration_offsets() -> None:
    """
    Delete all gripper calibration data files.
    """

    offset_dir = config.get_opentrons_path("gripper_calibration_dir")
    io._remove_json_files_in_directories(offset_dir)

# Save Gripper Offset Calibrations

def save_gripper_calibration(
    offset: types.Point,
    gripper_id: local_types.GripperId,
    cal_status: Optional[local_types.CalibrationStatus] = None,
) -> None:
    gripper_dir = config.get_opentrons_path("gripper_calibration_dir")
    gripper_dir.mkdir(parents=True, exist_ok=True)
    gripper_path = gripper_dir / f"{gripper_id}.json"

    if cal_status:
        cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
    else:
        cal_status_model = v1.CalibrationStatus()

    gripper_calibration = v1.InstrumentOffsetSchema(
        offset=offset,
        lastModified=utc_now(),
        source=local_types.SourceType.user,
        status=cal_status_model,
    )
    io.save_to_file(gripper_path, gripper_calibration)

# Get Gripper Offset Calibrations

def get_gripper_calibration_offset(
    gripper_id: local_types.GripperId,
) -> Optional[v1.InstrumentOffsetSchema]:
    """
    Return the requested gripper offset data.
    """
    if not config.feature_flags.enable_ot3_hardware_controller():
        raise NotImplementedError("Gripper calibrations are only valid on the OT-3")
    try:
        return _gripper_offset_calibrations()[gripper_id]
    except KeyError:
        return None

