import json
import logging
from pydantic import ValidationError
from typing import Optional, Union, no_type_check
from dataclasses import asdict

from opentrons import config
from opentrons.util.helpers import utc_now


from .. import file_operators as io, types as local_types

from .models import v1

log = logging.getLogger(__name__)


# Delete Belt Calibration


@no_type_check
def delete_robot_belt_attitude() -> None:
    """
    Delete the robot belt attitude calibration.
    """
    gantry_path = (
        config.get_opentrons_path("robot_calibration_dir") / "belt_calibration.json"
    )

    io.delete_file(gantry_path)


# Save Belt Calibration


@no_type_check
def save_robot_belt_attitude(
    transform: local_types.AttitudeMatrix,
    pip_id: Optional[str],
    source: Optional[local_types.SourceType] = None,
    cal_status: Optional[
        Union[local_types.CalibrationStatus, local_types.CalibrationStatus]
    ] = None,
) -> None:
    robot_dir = config.get_opentrons_path("robot_calibration_dir")

    if isinstance(cal_status, local_types.CalibrationStatus):
        cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
    elif isinstance(cal_status, v1.CalibrationStatus):
        cal_status_model = cal_status
    else:
        cal_status_model = v1.CalibrationStatus()

    gantry_calibration = v1.BeltCalibrationModel(
        attitude=transform,
        pipetteCalibratedWith=pip_id,
        lastModified=utc_now(),
        source=source or local_types.SourceType.user,
        status=cal_status_model,
    )
    # convert to schema + validate json conversion
    io.save_to_file(robot_dir, "belt_calibration", gantry_calibration)


# Get Belt Calibration


@no_type_check
def get_robot_belt_attitude() -> Optional[v1.BeltCalibrationModel]:
    belt_calibration_path = (
        config.get_opentrons_path("robot_calibration_dir") / "belt_calibration.json"
    )
    try:
        return v1.BeltCalibrationModel(**io.read_cal_file(belt_calibration_path))
    except FileNotFoundError:
        log.warning("Belt calibration not found.")
        pass
    except (json.JSONDecodeError, ValidationError):
        log.warning(
            "Belt calibration is malformed. Please factory reset your calibrations.",
            exc_info=True,
        )
    return None
