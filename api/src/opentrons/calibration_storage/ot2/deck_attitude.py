import os
import json
from pydantic import ValidationError
from typing import Optional
from dataclasses import asdict

from opentrons import config
from opentrons.util.helpers import utc_now


from .. import file_operators as io, types as local_types

from .schemas import v1


# Deck Calibration Look-Up


def _deck_calibration() -> Optional[v1.DeckCalibrationSchema]:
    deck_calibration_dir = config.get_opentrons_path("robot_calibration_dir")
    for file in os.scandir(deck_calibration_dir):
        if file.name == "deck_calibration.json":
            try:
                return v1.DeckCalibrationSchema(**io.read_cal_file(file.path))
            except (json.JSONDecodeError, ValidationError):
                pass
    return None


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
    io._delete_file(legacy_deck_calibration_file)
    io._delete_file(gantry_path)


# Save Deck Calibration


def save_robot_deck_attitude(
    transform: local_types.AttitudeMatrix,
    pip_id: Optional[local_types.PipetteId],
    lw_hash: Optional[local_types.TiprackHash],
    source: Optional[local_types.SourceType] = None,
    cal_status: Optional[local_types.CalibrationStatus] = None,
) -> None:
    robot_dir = config.get_opentrons_path("robot_calibration_dir")
    robot_dir.mkdir(parents=True, exist_ok=True)
    gantry_path = robot_dir / "deck_calibration.json"

    if cal_status:
        cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
    else:
        cal_status_model = v1.CalibrationStatus()

    gantry_calibration = v1.DeckCalibrationSchema(
        attitude=transform,
        pipette_calibrated_with=pip_id,
        last_modified=utc_now(),
        tiprack=lw_hash,
        source=source or local_types.SourceType.user,
        status=cal_status_model,
    )
    # convert to schema + validate json conversion
    io.save_to_file(gantry_path, gantry_calibration)


# Get Deck Calibration


def get_robot_deck_attitude() -> Optional[v1.DeckCalibrationSchema]:
    return _deck_calibration()
