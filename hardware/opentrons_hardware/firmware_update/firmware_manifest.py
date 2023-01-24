"""This module is responsible for loading/saving the opentrons_manifest.json file."""


from dataclasses import dataclass
from enum import Enum
import json
import logging
import os
from typing import Dict

from opentrons_hardware.firmware_update.errors import FirmwareManifestMissing


_FIRMWARE_MANIFEST_PATH = os.path.abspath("/usr/lib/firmware/opentrons-firmware.json")

log = logging.getLogger(__name__)


class FirmwareUpdateType(Enum):
    head = 0
    gantry_x = 1
    gantry_y = 2
    gripper = 3
    pipettes_single = 4
    pipettes_multi = 5
    pipettes_96 = 6
    pipettes_384 = 7

    def __str__(self) -> str:
        return self.name

    @classmethod
    def from_string(cls, name: str) -> "FirmwareUpdateType":
        # convert '-' to '_'so we can match enum name
        sanitized_name = name.replace("-", "_")
        return cls.__members__.get(sanitized_name)

    def from_model(cls, model: str) -> "FirmwareUpdateType":
        return cls.__members__.get('head')  # TODO: static for now

@dataclass
class UpdateInfo:
    def __init__(
        self,
        update_type: FirmwareUpdateType,
        version: int,
        shortsha: str,
        filepath: str,
    ) -> None:
        self.update_type = update_type
        self.version = version
        self.shortsha = shortsha
        self.filepath = filepath

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}: type={self.update_type}, version={self.version}, sha={self.shortsha}>"


def load_firmware_manifest(
    firmware_manifest: str = None,
) -> Dict[FirmwareUpdateType, UpdateInfo]:
    """Loads the opentrons firmware of the"""
    opentrons_firmware = firmware_manifest or _FIRMWARE_MANIFEST_PATH
    if not os.path.exists(opentrons_firmware):
        raise FirmwareManifestMissing(
            f"Firmware manifest file not found {opentrons_firmware}"
        )

    opentrons_manifest = {}
    try:
        with open(opentrons_firmware, "r") as fh:
            manifest = json.load(fh)
    except json.JSONDecodeError as e:
        log.error(f"Could not load manifest file {opentrons_firmware} {e}")
        return opentrons_manifest

    subsystems = manifest.get("subsystems")
    for subsystem_name, version_info in subsystems.items():
        update_type = FirmwareUpdateType.from_string(subsystem_name)
        if not update_type:
            log.warning(f"Invalid update type {subsystem_name}")
            continue
        update_info = _generate_firmware_info(update_type, version_info)
        if not update_info:
            log.warning(f"Invalid update info {subsystem_name} {version_info}")
            continue
        opentrons_manifest[update_type] = update_info
    return opentrons_manifest


def _generate_firmware_info(
    update_type: FirmwareUpdateType, version_info: dict
) -> UpdateInfo:
    """Validate the version info and return an UpdateInfo object if valid."""
    try:
        version = int(version_info.get("version"))
        shortsha = str(version_info.get("shortsha"))
        filepath = os.path.abspath(version_info.get("filepath"))
        if os.path.exists(filepath):
            raise FileNotFoundError
        return UpdateInfo(update_type, version, shortsha, filepath)
    except Exception as e:
        log.error(f"Issue serializing update info {update_type} {e}.")
        return
