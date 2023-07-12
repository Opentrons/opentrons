from datetime import datetime

from dataclasses import dataclass
from typing import List, Optional
from opentrons.calibration_storage.ot3.models.v1 import CalibrationStatus
from opentrons.calibration_storage.ot3.module_offset import (
    get_module_offset,
    load_all_module_offsets,
    save_module_calibration,
)
from opentrons.calibration_storage.types import SourceType
from opentrons.config.robot_configs import default_module_calibration_offset
from opentrons.hardware_control.modules.types import ModuleType
from opentrons.hardware_control.types import OT3Mount


from opentrons.types import Point


@dataclass
class ModuleCalibrationOffset:
    """Class to store module offset calibration data."""

    offset: Point
    module_id: str
    module: ModuleType
    source: SourceType
    status: CalibrationStatus
    slot: Optional[str] = None
    mount: Optional[OT3Mount] = None
    instrument_id: Optional[str] = None
    last_modified: Optional[datetime] = None


def load_module_calibration_offset(
    module_type: ModuleType,
    module_id: str,
    slot: Optional[str] = None,
) -> ModuleCalibrationOffset:
    """Loads the calibration offset for a module."""
    # load default if module offset data do not exist
    module_cal_obj = ModuleCalibrationOffset(
        slot=slot,
        offset=Point(*default_module_calibration_offset()),
        module=module_type,
        module_id=module_id,
        source=SourceType.default,
        status=CalibrationStatus(),
    )
    if module_id:
        module_offset_data = get_module_offset(module_type, module_id)
        if module_offset_data:
            return ModuleCalibrationOffset(
                module=module_type,
                module_id=module_id,
                slot=module_offset_data.slot,
                mount=module_offset_data.mount,
                offset=module_offset_data.offset,
                last_modified=module_offset_data.lastModified,
                instrument_id=module_offset_data.instrument_id,
                source=module_offset_data.source,
                status=CalibrationStatus(
                    markedAt=module_offset_data.status.markedAt,
                    markedBad=module_offset_data.status.markedBad,
                    source=module_offset_data.status.source,
                ),
            )
    return module_cal_obj


def save_module_calibration_offset(
    offset: Point,
    mount: OT3Mount,
    slot: str,
    module: ModuleType,
    module_id: str,
    instrument_id: Optional[str] = None,
) -> None:
    """Save the calibration offset for a given module."""
    if module_id:
        save_module_calibration(offset, mount, slot, module, module_id, instrument_id)


def load_all_module_calibrations() -> List[ModuleCalibrationOffset]:
    """Loads all the module calibration stored on the robot."""
    module_calibrations: List[ModuleCalibrationOffset] = []
    module_offset_data = load_all_module_offsets()
    for data in module_offset_data:
        module_calibrations.append(
            ModuleCalibrationOffset(
                slot=data.slot,
                module=data.module,
                module_id=data.module_id,
                mount=data.mount,
                offset=data.offset,
                last_modified=data.lastModified,
                instrument_id=data.instrument_id,
                source=data.source,
                status=CalibrationStatus(
                    markedAt=data.status.markedAt,
                    markedBad=data.status.markedBad,
                    source=data.status.source,
                ),
            )
        )
    return module_calibrations
