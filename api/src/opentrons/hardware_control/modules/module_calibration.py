from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

from opentrons.calibration_storage.ot3.models.v1 import CalibrationStatus
from opentrons.calibration_storage.ot3.module_offset import (
    get_module_offset,
    load_all_module_offsets,
    save_module_calibration,
)
from opentrons.calibration_storage.types import SourceType
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
    slot: str
    mount: Optional[OT3Mount] = None
    instrument_id: Optional[str] = None
    last_modified: Optional[datetime] = None

    @staticmethod
    def to_pyro_dict(obj: "ModuleCalibrationOffset") -> Dict[str, Any]:
        """Consumed by Serpent, convert type to a Pyro Dictionary."""

        if isinstance(obj.last_modified, datetime):
            modified = obj.last_modified.isoformat()
        else:
            modified = None
        return {
            "__class__": f"{obj.__module__}.{obj.__class__.__qualname__}",
            "offset_x": float(obj.offset.x),
            "offset_y": float(obj.offset.y),
            "offset_z": float(obj.offset.z),
            "module_id": obj.module_id,
            "module": obj.module.value,
            "source": obj.source.value,
            "status": obj.status.model_dump(mode="json", by_alias=True),
            "slot": obj.slot,
            "mount": None if obj.mount is None else obj.mount.value,
            "instrument_id": obj.instrument_id,
            "last_modified": modified,
        }

    @staticmethod
    def from_pyro_dict(
        classname: Any, data: Dict[str, Any]
    ) -> "ModuleCalibrationOffset":
        """Consumed by Serpent, convert from a Pyro Dictionary."""
        modified = (
            None
            if data["last_modified"] is None
            else datetime.fromisoformat(data["last_modified"])
        )
        return ModuleCalibrationOffset(
            offset=Point(x=data["offset_x"], y=data["offset_y"], z=data["offset_z"]),
            module_id=data["module_id"],
            module=ModuleType(data["module"]),
            source=SourceType(data["source"]),
            status=CalibrationStatus.model_validate(data["status"]),
            slot=data["slot"],
            mount=None if data["mount"] is None else OT3Mount(data["mount"]),
            instrument_id=data["instrument_id"],
            last_modified=modified,
        )


def load_module_calibration_offset(
    module_type: ModuleType,
    module_id: str,
) -> Optional[ModuleCalibrationOffset]:
    """Loads the calibration offset for a module."""
    module_offset_data = get_module_offset(module_type, module_id)
    if not module_offset_data:
        return None
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


def save_module_calibration_offset(
    offset: Point,
    mount: OT3Mount,
    slot: str,
    module: ModuleType,
    module_id: str,
    instrument_id: Optional[str] = None,
) -> None:
    """Save the calibration offset for a given module."""
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
