import json
import logging
from pydantic import ValidationError
from typing import Optional, Union, no_type_check
from dataclasses import asdict

from opentrons import config, types


from .. import file_operators as io, types as local_types
from opentrons.util.helpers import utc_now

from .models import v1

log = logging.getLogger(__name__)
# Delete Pipette Offset Calibrations


@no_type_check
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


@no_type_check
def save_pipette_calibration(
    offset: types.Point,
    pip_id: str,
    mount: types.Mount,
    cal_status: Optional[
        Union[local_types.CalibrationStatus, v1.CalibrationStatus]
    ] = None,
) -> None:
    pip_dir = config.get_opentrons_path("pipette_calibration_dir") / mount.name.lower()

    if isinstance(cal_status, local_types.CalibrationStatus):
        cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
    elif isinstance(cal_status, v1.CalibrationStatus):
        cal_status_model = cal_status
    else:
        cal_status_model = v1.CalibrationStatus()

    pipette_calibration = v1.InstrumentOffsetModel(
        offset=offset,
        lastModified=utc_now(),
        source=local_types.SourceType.user,
        status=cal_status_model,
    )
    io.save_to_file(pip_dir, pip_id, pipette_calibration)


# Get Pipette Offset Calibrations


@no_type_check
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
        log.debug(f"Calibrations for {pipette_id} on {mount} does not exist.")
        return None
    except (json.JSONDecodeError, ValidationError):
        log.warning(
            f"Malformed calibrations for {pipette_id} on {mount}. Please factory reset your calibrations.",
            exc_info=True,
        )
        return None
