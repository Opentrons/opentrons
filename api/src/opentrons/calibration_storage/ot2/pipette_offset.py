import os
import json
import typing
from pydantic import ValidationError
from dataclasses import asdict

from opentrons import config, types

from .. import file_operators as io, types as local_types

from .models import v1

from opentrons.types import Mount, Point
from opentrons.util.helpers import utc_now

PipetteCalibrations = typing.Dict[
    types.MountType, typing.Dict[local_types.PipetteId, v1.InstrumentOffsetModel]
]


# Pipette Offset Calibration Look-Up


def _pipette_offset_calibrations() -> PipetteCalibrations:
    pipette_calibration_dir = config.get_opentrons_path("pipette_calibration_dir")
    pipette_calibration_dict: PipetteCalibrations = {}
    for mount in types.MountType:
        pipette_calibration_dict[mount] = {}
        mount_dir = pipette_calibration_dir / mount.value
        if not mount_dir.exists():
            continue
        for file in os.scandir(mount_dir):
            if file.is_file() and ".json" in file.name:
                pipette_id = typing.cast(
                    local_types.PipetteId, file.name.split(".json")[0]
                )
                try:
                    pipette_calibration_dict[mount][
                        pipette_id
                    ] = v1.InstrumentOffsetModel(**io.read_cal_file(file.path))
                except (json.JSONDecodeError, ValidationError):
                    pass
    return pipette_calibration_dict


# Delete Pipette Offset Calibrations


def delete_pipette_offset_file(pipette: local_types.PipetteId, mount: Mount) -> None:
    """
    Delete pipette offset file based on mount and pipette serial number

    :param pipette: pipette serial number
    :param mount: pipette mount
    """
    offset_dir = config.get_opentrons_path("pipette_calibration_dir")
    offset_path = offset_dir / mount.name.lower() / f"{pipette}.json"
    io._delete_file(offset_path)


def clear_pipette_offset_calibrations() -> None:
    """
    Delete all pipette offset calibration files.
    """

    offset_dir = config.get_opentrons_path("pipette_calibration_dir")
    io._remove_json_files_in_directories(offset_dir)


# Save Pipette Offset Calibrations


def save_pipette_calibration(
    offset: Point,
    pip_id: local_types.PipetteId,
    mount: Mount,
    tiprack_hash: local_types.TiprackHash,
    tiprack_uri: str,
    cal_status: typing.Optional[
        typing.Union[local_types.CalibrationStatus, v1.CalibrationStatus]
    ] = None,
) -> None:
    pip_dir = config.get_opentrons_path("pipette_calibration_dir") / mount.name.lower()

    offset_path = pip_dir / f"{pip_id}.json"
    if cal_status and isinstance(cal_status, local_types.CalibrationStatus):
        cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
    elif cal_status and isinstance(cal_status, v1.CalibrationStatus):
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
    io.save_to_file(offset_path, pipette_calibration)


# Get Pipette Offset Calibrations


def get_pipette_offset(
    pipette_id: local_types.PipetteId, mount: Mount
) -> typing.Optional[v1.InstrumentOffsetModel]:
    if mount == types.Mount.LEFT:
        mount_type = types.MountType.LEFT
    else:
        mount_type = types.MountType.RIGHT
    try:
        return _pipette_offset_calibrations()[mount_type][pipette_id]
    except KeyError:
        return None


def get_all_pipette_offset_calibrations() -> typing.List[v1.PipetteOffsetCalibration]:
    """
    A helper function that will list all of the pipette offset
    calibrations.

    :return: A list of dictionary objects representing all of the
    pipette offset calibration files found on the robot.
    """
    pipette_calibration_list = []
    for mount, pipettes in _pipette_offset_calibrations().items():
        for pipette, calibration in pipettes.items():
            pipette_calibration_list.append(
                v1.PipetteOffsetCalibration(
                    pipette=pipette,
                    mount=mount,
                    offset=types.Point(*calibration.offset),
                    tiprack=calibration.tiprack,
                    uri=calibration.uri,
                    last_modified=calibration.last_modified,
                    source=calibration.source,
                    status=calibration.status,
                )
            )
    return pipette_calibration_list
