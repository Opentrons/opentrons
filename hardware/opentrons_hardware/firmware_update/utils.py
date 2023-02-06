"""This module provides utilities for the firmware update module."""


from dataclasses import dataclass
from enum import Enum
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional, Union
from opentrons_hardware.firmware_bindings.constants import NodeId

from opentrons_hardware.firmware_update.errors import FirmwareManifestMissing
from opentrons_hardware.hardware_control.network import DeviceInfoCache


_FIRMWARE_MANIFEST_PATH = os.path.abspath("/usr/lib/firmware/opentrons-firmware.json")

log = logging.getLogger(__name__)


class FirmwareUpdateType(Enum):
    """The type of firmware update."""

    head = 0
    gantry_x = 1
    gantry_y = 2
    gripper = 3
    pipettes_single = 4
    pipettes_multi = 5
    pipettes_96 = 6
    pipettes_384 = 7
    unknown = -1

    def __str__(self) -> str:
        """Name of enum."""
        return str(self.name)

    @classmethod
    def from_name(cls, name: str) -> "FirmwareUpdateType":
        """Return FirmwareUpdateType with given name."""
        sanitized_name = name.replace("-", "_")
        return cls.__members__.get(sanitized_name, cls.unknown)

    @classmethod
    def from_channels(cls, channels: int) -> "FirmwareUpdateType":
        """Return FirmwareUpdateType for pipettes with given channels."""
        pipette_channels = {
            1: cls.pipettes_single,
            8: cls.pipettes_multi,
            96: cls.pipettes_96,
            384: cls.pipettes_384,
        }
        return pipette_channels.get(channels, cls.unknown)


@dataclass
class UpdateInfo:
    """Data for a firmware update."""

    def __init__(
        self,
        update_type: FirmwareUpdateType,
        version: int,
        shortsha: str,
        files_by_revision: Dict[str, str],
        filepath: Optional[str] = str(),
    ) -> None:
        """Constructor."""
        self.update_type = update_type
        self.version = version
        self.shortsha = shortsha
        self.files_by_revision = files_by_revision
        self.filepath = filepath

    def __repr__(self) -> str:
        """Readable representation of class."""
        return f"<{self.__class__.__name__}: type={self.update_type}, version={self.version}, sha={self.shortsha}>"


def load_firmware_manifest(
    firmware_manifest: Union[str, Path] = str(),
) -> Dict[FirmwareUpdateType, UpdateInfo]:
    """Serializes the opentrons firmware update info."""
    opentrons_manifest: Dict[FirmwareUpdateType, UpdateInfo] = dict()
    opentrons_firmware = firmware_manifest or _FIRMWARE_MANIFEST_PATH
    if not os.path.exists(opentrons_firmware):
        raise FirmwareManifestMissing(
            f"Firmware manifest file not found {opentrons_firmware}"
        )
    try:
        with open(opentrons_firmware, "r") as fh:
            manifest = json.load(fh)
    except json.JSONDecodeError as e:
        log.error(f"Could not load manifest file {opentrons_firmware} {e}")
        return opentrons_manifest

    # Serialize the update info
    subsystems = manifest.get("subsystems", {})
    for subsystem_name, version_info in subsystems.items():
        update_type = FirmwareUpdateType.from_name(subsystem_name)
        if not update_type:
            log.debug(f"Invalid update type {subsystem_name}")
            continue
        update_info = _generate_firmware_info(update_type, version_info)
        if not update_info:
            log.debug(f"Invalid update info {subsystem_name} {version_info}")
            continue
        opentrons_manifest[update_type] = update_info
    return opentrons_manifest


def _generate_firmware_info(
    update_type: FirmwareUpdateType, version_info: Dict[str, Any]
) -> Union[UpdateInfo, None]:
    """Validate the version info and return an UpdateInfo object if valid."""
    try:
        version: int = int(version_info.get("version", 0))
        shortsha: str = str(version_info.get("shortsha", ""))
        files_by_revision: Dict[str, str] = version_info.get("files_by_revision", {})
        if not all([version, shortsha, files_by_revision]):
            log.error(f"Invalid update info {version_info}")
            raise ValueError

        # make sure files exist on disk
        for rev, filepath in files_by_revision.items():
            if not os.path.exists(filepath):
                log.error(f"{rev} File not found {filepath}")
                raise FileNotFoundError
        return UpdateInfo(update_type, version, shortsha, files_by_revision)
    except Exception as e:
        log.error(f"Issue serializing update info {update_type} {e}.")
        return None


def check_firmware_updates(
    device_info: Dict[NodeId, DeviceInfoCache],
    attached_pipettes: Dict[NodeId, int],
    force: Optional[bool] = False,
) -> Dict[NodeId, UpdateInfo]:
    """Returns a dict of NodeIds that require a firmware update."""
    known_firmware = load_firmware_manifest()
    if known_firmware is None:
        log.error("Could not load the known firmware.")
        return

    firmware_update_list: Dict[NodeId, UpdateInfo] = dict()
    for node, version_cache in device_info.items():
        log.debug(f"Checking firmware update for {node.name}")
        # Get the update type based on the channels if pipette
        if attached_pipettes and node in [NodeId.pipette_left, NodeId.pipette_right]:
            channels = attached_pipettes.get(node, 0)
            update_type = FirmwareUpdateType.from_channels(channels)
        else:
            update_type = FirmwareUpdateType.from_name(node.name)
        if update_type == FirmwareUpdateType.unknown:
            log.error(f"Unknown firmware update type for {node.name}")
            continue

        # Given the update_type find the corresponding updateInfo
        update_info = known_firmware.get(update_type)
        if not update_info:
            log.warning(f"No firmware update found for {node.name}")
            continue
        if force or version_cache.shortsha != update_info.shortsha:
            log.info(
                f"Subsystem {node.name} requires an update, device sha: {version_cache.shortsha} != update sha: {update_info.shortsha}"
            )
            # TODO (BA, 02/03/2022): Get the filepath based on the revision once we add it to GetDeviceInfoResponse.
            # For now just select the first value.
            update_info.filepath = list(update_info.files_by_revision.values())[0]
            firmware_update_list[node] = update_info
    return firmware_update_list
