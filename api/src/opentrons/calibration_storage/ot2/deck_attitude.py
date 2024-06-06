import json
import logging
from pydantic import ValidationError
from typing import Optional, Union
from dataclasses import asdict

from opentrons import config
from opentrons.util.helpers import utc_now


from .. import file_operators as io, types as local_types

from .models import v1

log = logging.getLogger(__name__)

# Delete Deck Calibration


def delete_robot_deck_attitude() -> None:
    """
    Delete the robot deck attitude calibration.
    """
    legacy_deck_calibration_file = config.get_opentrons_path("deck_calibration_file")

    robot_dir = config.get_opentrons_path("robot_calibration_dir")
    gantry_path = robot_dir / "deck_calibration.json"

    # TODO(mc, 2022-06-08): this leaves legacy deck calibration backup files in place
    # we should eventually clean them up, too, because they can really crowd /data/
    io.delete_file(legacy_deck_calibration_file)
    io.delete_file(gantry_path)


# Save Deck Calibration


def save_robot_deck_attitude(
    transform: local_types.AttitudeMatrix,
    pip_id: Optional[str],
    lw_hash: Optional[str],
    source: Optional[local_types.SourceType] = None,
    cal_status: Optional[
        Union[local_types.CalibrationStatus, v1.CalibrationStatus]
    ] = None,
) -> None:
    robot_dir = config.get_opentrons_path("robot_calibration_dir")

    if isinstance(cal_status, local_types.CalibrationStatus):
        cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
    elif isinstance(cal_status, v1.CalibrationStatus):
        cal_status_model = cal_status
    else:
        cal_status_model = v1.CalibrationStatus()

    gantry_calibration = v1.DeckCalibrationModel(
        attitude=transform,
        pipette_calibrated_with=pip_id,
        last_modified=utc_now(),
        tiprack=lw_hash,
        source=source or local_types.SourceType.user,
        status=cal_status_model,
    )
    # convert to schema + validate json conversion
    io.save_to_file(robot_dir, "deck_calibration", gantry_calibration)


# Get Deck Calibration


def get_robot_deck_attitude() -> Optional[v1.DeckCalibrationModel]:
    deck_calibration_path = (
        config.get_opentrons_path("robot_calibration_dir") / "deck_calibration.json"
    )
    try:
        return v1.DeckCalibrationModel(**io.read_cal_file(deck_calibration_path))
    except FileNotFoundError:
        log.warning("Deck calibration not found.")
        pass
    except (json.JSONDecodeError, ValidationError):
        log.warning(
            "Deck calibration is malformed. Please factory reset your calibrations.",
            exc_info=True,
        )
    return None
