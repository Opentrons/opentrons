import os
import json
from pathlib import Path
from pydantic import ValidationError
from typing import Dict, cast, Optional, Union

from opentrons import config, types
from dataclasses import asdict
from opentrons.util.helpers import utc_now


from .. import file_operators as io, types as local_types

from .models import v1


# Delete Gripper Offset Calibrations


def delete_gripper_calibration_file(gripper: local_types.GripperId) -> None:
    """
    Delete gripper calibration offset file based on gripper serial number

    :param gripper: gripper serial number
    """
    offset_path = (
        Path(config.get_opentrons_path("gripper_calibration_dir")) / f"{gripper}.json"
    )
    io.delete_file(offset_path)


def clear_gripper_calibration_offsets() -> None:
    """
    Delete all gripper calibration data files.
    """

    offset_dir = Path(config.get_opentrons_path("gripper_calibration_dir"))
    io._remove_json_files_in_directories(offset_dir)


# Save Gripper Offset Calibrations


def save_gripper_calibration(
    offset: types.Point,
    gripper_id: local_types.GripperId,
    cal_status: Optional[
        Union[local_types.CalibrationStatus, v1.CalibrationStatus]
    ] = None,
) -> None:
    gripper_dir = Path(config.get_opentrons_path("gripper_calibration_dir"))

    if cal_status and isinstance(cal_status, local_types.CalibrationStatus):
        cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
    elif cal_status and isinstance(cal_status, v1.CalibrationStatus):
        cal_status_model = cal_status
    else:
        cal_status_model = v1.CalibrationStatus()

    gripper_calibration = v1.InstrumentOffsetModel(
        offset=offset,
        lastModified=utc_now(),
        source=local_types.SourceType.user,
        status=cal_status_model,
    )
    io.save_to_file(gripper_dir, gripper_id, gripper_calibration)


# Get Gripper Offset Calibrations


def get_gripper_calibration_offset(
    gripper_id: local_types.GripperId,
) -> Optional[v1.InstrumentOffsetModel]:
    """
    Return the requested gripper offset data.
    """
    if not config.feature_flags.enable_ot3_hardware_controller():
        raise NotImplementedError("Gripper calibrations are only valid on the OT-3")
    try:
        gripper_calibration_filepath = (
            Path(config.get_opentrons_path("gripper_calibration_dir"))
            / f"{gripper_id}.json"
        )
        return v1.InstrumentOffsetModel(
            **io.read_cal_file(gripper_calibration_filepath)
        )
    except FileNotFoundError:
        return None
    except (json.JSONDecodeError, ValidationError):
        return None
