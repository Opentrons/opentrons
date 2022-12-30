import json
import logging
from pydantic import ValidationError
from typing import Optional

from opentrons import config, types


from .. import file_operators as io, types as local_types
from opentrons.util.helpers import utc_now

from .models import v1

log = logging.getLogger(__name__)
# Delete Pipette Offset Calibrations


def delete_pipette_offset_file(pipette: str, mount: types.Mount) -> None:
    """
    Delete pipette offset file based on mount and pipette serial number

    :param pipette: pipette serial number
    :param mount: pipette mount
    """
    offset_dir = config.get_opentrons_path("pipette_calibration_dir")
    offset_path = offset_dir / mount.name.lower() / f"{pipette}.json"
    io.delete_file(offset_path)


def clear_pipette_offset_calibrations() -> None:
    """
    Delete all pipette offset calibration files.
    """

    offset_dir = config.get_opentrons_path("pipette_calibration_dir")
    io._remove_json_files_in_directories(offset_dir)


# Save Pipette Offset Calibrations

def save_pipette_calibration(
    offset: types.Point,
    pip_id: str,
    mount: types.Mount,
) -> None:
    pip_dir = config.get_opentrons_path("pipette_calibration_dir") / mount.name.lower()

    pipette_calibration = v1.InstrumentOffsetModel(
        offset=offset,
        lastModified=utc_now(),
        source=local_types.SourceType.user,
        status=v1.CalibrationStatus(),
    )
    io.save_to_file(pip_dir, pip_id, pipette_calibration)


# Get Pipette Offset Calibrations

def get_pipette_offset(
    pipette_id: str, mount: types.Mount
) -> Optional[v1.InstrumentOffsetModel]:
    try:
        pipette_calibration_filepath = (
            config.get_opentrons_path("pipette_calibration_dir")
            / mount.name.lower()
            / f"{pipette_id}.json"
        )
        return v1.InstrumentOffsetModel(
            **io.read_cal_file(pipette_calibration_filepath)
        )
    except FileNotFoundError:
        log.warning(f"Calibrations for {pipette_id} on {mount} does not exist.")
        return None
    except (json.JSONDecodeError, ValidationError):
        log.warning(
            f"Malformed calibrations for {pipette_id} on {mount}. Please factory reset your calibrations."
        )
        return None
