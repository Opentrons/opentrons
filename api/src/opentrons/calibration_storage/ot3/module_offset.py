import json
import logging
import os
from functools import lru_cache
from pathlib import Path
from opentrons.hardware_control.modules.types import ModuleType
from opentrons.hardware_control.types import OT3Mount
from pydantic import ValidationError
from typing import List, Optional, Union, no_type_check
from dataclasses import asdict

from opentrons import config, types


from .. import file_operators as io, types as local_types
from opentrons.util.helpers import utc_now

from .models import v1

log = logging.getLogger(__name__)
# Delete Module Offset Calibrations


@no_type_check
def delete_module_offset_file(module_id: str) -> None:
    """
    Delete module offset file for the given module id.

    :param module: module id serial number
    """
    offset_dir = config.get_opentrons_path("module_calibration_dir")
    offset_path = offset_dir / f"{module_id}.json"
    io.delete_file(offset_path)
    # something changed, clear lru cache
    get_module_offset.cache_clear()
    load_all_module_offsets.cache_clear()


def clear_module_offset_calibrations() -> None:
    """
    Delete all module offset calibration files.
    """

    offset_dir = config.get_opentrons_path("module_calibration_dir")
    io._remove_json_files_in_directories(offset_dir)
    # something changed, clear lru cache
    get_module_offset.cache_clear()
    load_all_module_offsets.cache_clear()


# Save Module Offset Calibrations


@no_type_check
def save_module_calibration(
    offset: types.Point,
    mount: OT3Mount,
    slot: str,
    module: ModuleType,
    module_id: str,
    instrument_id: Optional[str] = None,
    cal_status: Optional[
        Union[local_types.CalibrationStatus, v1.CalibrationStatus]
    ] = None,
) -> None:
    module_dir = config.get_opentrons_path("module_calibration_dir")
    if isinstance(cal_status, local_types.CalibrationStatus):
        cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
    elif isinstance(cal_status, v1.CalibrationStatus):
        cal_status_model = cal_status
    else:
        cal_status_model = v1.CalibrationStatus()

    module_calibration = v1.ModuleOffsetModel(
        offset=offset,
        mount=mount,
        slot=slot,
        module=module,
        module_id=module_id,
        instrument_id=instrument_id,
        lastModified=utc_now(),
        source=local_types.SourceType.user,
        status=cal_status_model,
    )
    io.save_to_file(module_dir, module_id, module_calibration)
    # something changed, clear lru cache
    get_module_offset.cache_clear()
    load_all_module_offsets.cache_clear()


# Get Module Offset Calibrations


@no_type_check
@lru_cache(maxsize=10)
def get_module_offset(
    module: ModuleType, module_id: str, slot: Optional[str] = None
) -> Optional[v1.ModuleOffsetModel]:
    try:
        module_calibration_filepath = (
            config.get_opentrons_path("module_calibration_dir") / f"{module_id}.json"
        )
        return v1.ModuleOffsetModel(**io.read_cal_file(module_calibration_filepath))
    except FileNotFoundError:
        log.warning(
            f"Calibrations for {module} {module_id} on slot {slot} does not exist."
        )
        return None
    except (json.JSONDecodeError, ValidationError):
        log.warning(
            f"Malformed calibrations for {module_id} on slot {slot}. Please factory reset your calibrations.",
            exc_info=True,
        )
        return None


@lru_cache(maxsize=10)
def load_all_module_offsets() -> List[v1.ModuleOffsetModel]:
    """Load all module offsets from the disk."""

    calibrations: List[v1.ModuleOffsetModel] = []
    files = os.listdir(config.get_opentrons_path("module_calibration_dir"))
    for file in files:
        try:
            calibrations.append(
                v1.ModuleOffsetModel(
                    **io.read_cal_file(
                        Path(config.get_opentrons_path("module_calibration_dir") / file)
                    )
                )
            )
        except (json.JSONDecodeError, ValidationError):
            log.warning(
                f"Malformed module calibrations for {file}. Please factory reset your calibrations.",
                exc_info=True,
            )
            continue
    return calibrations
