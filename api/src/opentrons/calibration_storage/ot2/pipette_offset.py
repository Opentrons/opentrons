import json
import typing
import logging
from pydantic import ValidationError
from dataclasses import asdict

from opentrons import config, types

from .. import file_operators as io, types as local_types

from .models import v1

from opentrons.types import Mount, Point
from opentrons.util.helpers import utc_now

log = logging.getLogger(__name__)

# Delete Pipette Offset Calibrations


def delete_pipette_offset_file(pipette: str, mount: Mount) -> None:
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
    io._remove_json_files_in_directories(
        config.get_opentrons_path("pipette_calibration_dir")
    )


# Save Pipette Offset Calibrations


def save_pipette_calibration(
    offset: Point,
    pip_id: str,
    mount: Mount,
    tiprack_hash: str,
    tiprack_uri: str,
    cal_status: typing.Optional[
        typing.Union[local_types.CalibrationStatus, v1.CalibrationStatus]
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
        tiprack=tiprack_hash,
        uri=tiprack_uri,
        last_modified=utc_now(),
        source=local_types.SourceType.user,
        status=cal_status_model,
    )
    io.save_to_file(pip_dir, pip_id, pipette_calibration)


# Get Pipette Offset Calibrations


def get_pipette_offset(
    pipette_id: str, mount: Mount
) -> typing.Optional[v1.InstrumentOffsetModel]:
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
        # TODO: Delete the bad calibration here maybe?
        return None


def get_all_pipette_offset_calibrations() -> typing.List[v1.PipetteOffsetCalibration]:
    """
    A helper function that will list all of the pipette offset
    calibrations.

    :return: A list of dictionary objects representing all of the
    pipette offset calibration files found on the robot.
    """
    pipette_calibration_dir = config.get_opentrons_path("pipette_calibration_dir")
    pipette_calibration_list = []
    for filepath in pipette_calibration_dir.glob("**/*.json"):
        pipette_id = filepath.stem
        mount = Mount.string_to_mount(filepath.parent.stem)
        calibration = get_pipette_offset(pipette_id, mount)
        if calibration:
            pipette_calibration_list.append(
                v1.PipetteOffsetCalibration(
                    pipette=pipette_id,
                    mount=mount.name.lower(),
                    offset=types.Point(*calibration.offset),
                    tiprack=calibration.tiprack,
                    uri=calibration.uri,
                    last_modified=calibration.last_modified,
                    source=calibration.source,
                    status=calibration.status,
                )
            )
    return pipette_calibration_list
