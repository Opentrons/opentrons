import os
import json
from pydantic import ValidationError
from typing import Dict, cast, Optional
from dataclasses import asdict

from opentrons import config, types


from .. import file_operators as io, types as local_types
from opentrons.util.helpers import utc_now

from .schemas import v1


PipetteCalibrations = Dict[types.MountType, Dict[local_types.PipetteId, v1.InstrumentOffsetSchema]]


# Pipette Offset Calibrations Look-Up

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
                pipette_id = cast(local_types.PipetteId, file.name.split(".json")[0])
                try:
                    pipette_calibration_dict[mount][
                        pipette_id
                    ] = v1.InstrumentOffsetSchema(**io.read_cal_file(file.path))
                except (json.JSONDecodeError, ValidationError):
                    pass

    return pipette_calibration_dict


# Delete Pipette Offset Calibrations

def delete_pipette_offset_file(pipette: local_types.PipetteId, mount: types.Mount) -> None:
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
    offset: types.Point,
    pip_id: local_types.PipetteId,
    mount: types.Mount,
    cal_status: Optional[local_types.CalibrationStatus] = None,
) -> None:
    pip_dir = config.get_opentrons_path("pipette_calibration_dir") / mount.name.lower()
    pip_dir.mkdir(parents=True, exist_ok=True)

    offset_path = pip_dir / f"{pip_id}.json"

    if cal_status:
        cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
    else:
        cal_status_model = v1.CalibrationStatus()

    pipette_calibration = v1.InstrumentOffsetSchema(
        offset=offset,
        lastModified=utc_now(),
        source=local_types.SourceType.user,
        status=cal_status_model,
    )
    io.save_to_file(offset_path, pipette_calibration)


# Get Pipette Offset Calibrations

def get_pipette_offset(
    pipette_id: local_types.PipetteId, mount: types.Mount
) -> Optional[v1.InstrumentOffsetSchema]:
    if mount == types.Mount.LEFT:
        mount_type = types.MountType.LEFT
    else:
        mount_type = types.MountType.RIGHT
    try:
        return _pipette_offset_calibrations()[mount_type][pipette_id]
    except KeyError:
        return None
