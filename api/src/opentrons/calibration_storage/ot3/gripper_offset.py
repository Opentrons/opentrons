import json
from pydantic import ValidationError
from typing import Optional, Union

from opentrons import config, types
from dataclasses import asdict
from opentrons.util.helpers import utc_now


from .. import file_operators as io, types as local_types

from .models import v1


# Delete Gripper Offset Calibrations


def delete_gripper_calibration_file(gripper: str) -> None:
    """
    Delete gripper calibration offset file based on gripper serial number

    :param gripper: gripper serial number
    """
    offset_path = (
        config.get_opentrons_path("gripper_calibration_dir") / f"{gripper}.json"
    )

    io.delete_file(offset_path)


def clear_gripper_calibration_offsets() -> None:
    """
    Delete all gripper calibration data files.
    """

    offset_dir = config.get_opentrons_path("gripper_calibration_dir")
    io._remove_json_files_in_directories(offset_dir)


# Delete Gripper Jaw Width Calibration


def delete_gripper_jaw_width_data_file(gripper: str) -> None:
    """
    Delete gripper jaw width data file based on gripper serial number

    :param gripper: gripper serial number
    """
    offset_path = config.get_opentrons_path("gripper_jaw_width_dir") / f"{gripper}.json"
    io.delete_file(offset_path)


def clear_gripper_jaw_width_data() -> None:
    """
    Delete all gripper jaw width data files.
    """
    offset_dir = config.get_opentrons_path("gripper_jaw_width_dir")
    io._remove_json_files_in_directories(offset_dir)


# Save Gripper Offset Calibrations


def save_gripper_calibration(
    offset: types.Point,
    gripper_id: str,
    cal_status: Optional[
        Union[local_types.CalibrationStatus, v1.CalibrationStatus]
    ] = None,
) -> None:
    gripper_dir = config.get_opentrons_path("gripper_calibration_dir")

    if isinstance(cal_status, local_types.CalibrationStatus):
        cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
    elif isinstance(cal_status, v1.CalibrationStatus):
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


# Save Gripper Jaw Width Data


def save_gripper_jaw_width_data(
    encoder_position_at_jaw_closed: float,
    gripper_id: str,
    cal_status: Optional[
        Union[local_types.CalibrationStatus, v1.CalibrationStatus]
    ] = None,
) -> None:
    gripper_jaw_width_dir = config.get_opentrons_path("gripper_jaw_width_dir")

    if isinstance(cal_status, local_types.CalibrationStatus):
        cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
    elif isinstance(cal_status, v1.CalibrationStatus):
        cal_status_model = cal_status
    else:
        cal_status_model = v1.CalibrationStatus()

    gripper_jaw_width = v1.GripperJawWidthModel(
        encoderPositionAtJawClosed=encoder_position_at_jaw_closed,
        lastModified=utc_now(),
        source=local_types.SourceType.user,
        status=cal_status_model,
    )
    io.save_to_file(gripper_jaw_width_dir, gripper_id, gripper_jaw_width)


# Get Gripper Offset Calibrations


def get_gripper_calibration_offset(
    gripper_id: str,
) -> Optional[v1.InstrumentOffsetModel]:
    """
    Return the requested gripper offset data.
    """
    if not config.feature_flags.enable_ot3_hardware_controller():
        raise NotImplementedError("Gripper calibrations are only valid on the OT-3")
    try:
        gripper_calibration_filepath = (
            config.get_opentrons_path("gripper_calibration_dir") / f"{gripper_id}.json"
        )
        return v1.InstrumentOffsetModel(
            **io.read_cal_file(gripper_calibration_filepath)
        )
    except FileNotFoundError:
        return None
    except (json.JSONDecodeError, ValidationError):
        return None


# Get Gripper Jaw Width


def get_gripper_jaw_width_data(gripper_id: str) -> Optional[v1.GripperJawWidthModel]:
    """Return the requested gripper jaw width data."""
    if not config.feature_flags.enable_ot3_hardware_controller():
        raise NotImplementedError("Gripper jaw width data only available on the OT-3.")
    try:
        gripper_jaw_width_filepath = (
            config.get_opentrons_path("gripper_jaw_width_dir") / f"{gripper_id}.json"
        )
        return v1.GripperJawWidthModel(**io.read_cal_file(gripper_jaw_width_filepath))
    except FileNotFoundError:
        return None
    except (json.JSONDecodeError, ValidationError):
        return None
