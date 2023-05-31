"""This module provides utilities for the firmware update module."""


from dataclasses import dataclass
from typing_extensions import Final, Protocol
from enum import Enum
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional, Set, Union, Tuple, Iterable, Iterator
from opentrons_hardware.firmware_bindings.constants import (
    FirmwareTarget,
    NodeId,
    PipetteType,
    USBTarget,
)
from opentrons_hardware.hardware_control.network import DeviceInfoCache


_FIRMWARE_MANIFEST_PATH: Final = os.path.abspath(
    "/usr/lib/firmware/opentrons-firmware.json"
)

_DEFAULT_PCBA_REVS: Final[Dict[FirmwareTarget, str]] = {
    NodeId.head: "c2",
    NodeId.gantry_x: "c1",
    NodeId.gantry_y: "c1",
    NodeId.gripper: "c1",
    USBTarget.rear_panel: "b1",
}

_DEFAULT_PCBA_REVS_PIPETTE: Final[Dict[PipetteType, str]] = {
    PipetteType.pipette_single: "c2",
    PipetteType.pipette_multi: "c2",
    PipetteType.pipette_96: "c1",
}

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
    rear_panel = 7
    unknown = -1
    unknown_no_subtype = -2
    unknown_no_revision = -3

    def __str__(self) -> str:
        """Name of enum."""
        return str(self.name)

    @classmethod
    def from_name(cls, name: str) -> "FirmwareUpdateType":
        """Return FirmwareUpdateType with given name."""
        sanitized_name = name.replace("-", "_")
        return cls.__members__.get(sanitized_name, cls.unknown)

    @classmethod
    def from_firmware_target(cls, target: FirmwareTarget) -> "FirmwareUpdateType":
        """Return FirmwareUpdateType with given firmware target."""
        return (
            cls.from_node(NodeId(target))
            if target in NodeId
            else cls.from_usb_target(USBTarget(target))
        )

    @classmethod
    def from_usb_target(cls, target: USBTarget) -> "FirmwareUpdateType":
        """Return FirmwareUpdateType with given usb target."""
        lookup = {
            USBTarget.rear_panel: cls.rear_panel,
        }
        return lookup.get(target, cls.unknown)

    @classmethod
    def from_node(cls, node: NodeId) -> "FirmwareUpdateType":
        """Return FirmwareUpdateType with given node."""
        lookup = {
            NodeId.head: cls.head,
            NodeId.gantry_x: cls.gantry_x,
            NodeId.gantry_y: cls.gantry_y,
            NodeId.gripper: cls.gripper,
        }
        return lookup[node.application_for()]

    @classmethod
    def from_node_info(cls, node: NodeId, subid: int) -> "FirmwareUpdateType":
        """Build an update type from a node and subid."""
        if node.application_for() in (NodeId.pipette_left, NodeId.pipette_right):
            return cls.from_pipette(PipetteType(subid))
        return cls.from_node(node)

    @classmethod
    def from_pipette(cls, pipette: PipetteType) -> "FirmwareUpdateType":
        """Return FirmwareUpdateType for pipettes with given pipette type."""
        pipettes = {
            pipette.pipette_single: cls.pipettes_single,
            pipette.pipette_multi: cls.pipettes_multi,
            pipette.pipette_96: cls.pipettes_96,
        }
        return pipettes.get(pipette, cls.unknown)


@dataclass
class UpdateInfo:
    """Data for a firmware update."""

    def __init__(
        self,
        update_type: FirmwareUpdateType,
        version: int,
        shortsha: str,
        files_by_revision: Dict[str, str],
    ) -> None:
        """Constructor."""
        self.update_type = update_type
        self.version = version
        self.shortsha = shortsha
        self.files_by_revision = files_by_revision

    def __repr__(self) -> str:
        """Readable representation of class."""
        return f"<{self.__class__.__name__}: type={self.update_type}, version={self.version}, sha={self.shortsha}>"


def load_firmware_manifest(
    firmware_manifest: Optional[Union[str, Path]] = None,
) -> Dict[FirmwareUpdateType, UpdateInfo]:
    """Serializes the opentrons firmware update info."""
    opentrons_manifest: Dict[FirmwareUpdateType, UpdateInfo] = dict()
    opentrons_firmware = firmware_manifest or _FIRMWARE_MANIFEST_PATH
    try:
        with open(opentrons_firmware, "r") as fh:
            manifest = json.load(fh)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        log.error(f"Could not load manifest file {opentrons_firmware} {e}")
        return opentrons_manifest

    # Serialize the update info
    subsystems = manifest.get("subsystems", {})
    subsystems.update(manifest.get("usb_subsystems", {}))
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
        version: int = version_info.get("version", 0)
        shortsha: str = version_info.get("shortsha", "")
        files_by_revision: Dict[str, str] = version_info.get("files_by_revision", {})
        version_keys = [version, shortsha, files_by_revision]
        if not all(version_keys):
            raise ValueError(f"Empty or invalid key {version_keys}")

        # make sure files exist on disk
        for rev, filepath in files_by_revision.items():
            if not os.path.exists(filepath):
                raise FileNotFoundError(f"Missing File {filepath}")
        return UpdateInfo(update_type, version, shortsha, files_by_revision)
    except Exception as e:
        log.error(f"Issue serializing update info {update_type}: {e}")
        return None


def _revision_for_core_or_gripper(device_info: DeviceInfoCache) -> str:
    """Returns the appropriate defaulted revision for a non-pipette.

    The default revision can be determined solely from the node id. This is needed
    because PCBAs of the default revision were built before revision handling was
    introduced, and cannot be updated because too many were made.
    """
    return (
        device_info.revision.main
        or _DEFAULT_PCBA_REVS[device_info.target.application_for()]
    )


def _revision_for_pipette(
    device_info: DeviceInfoCache, fallback_pipette_type: PipetteType
) -> str:
    """Returns the appropriate defaulted revision for a pipette.

    The default revision can be determined solely from the pipette type. This is
    needed because PCBAs of the default revision were built before revision handling
    was introduced, and cannot be updated because too many were made.
    """
    try:
        pipette_type = PipetteType(device_info.subidentifier)
    except ValueError:
        pipette_type = fallback_pipette_type
    return device_info.revision.main or _DEFAULT_PCBA_REVS_PIPETTE[pipette_type]


def _revision(version_cache: DeviceInfoCache) -> str:
    if version_cache.target.application_for() in (
        NodeId.pipette_left,
        NodeId.pipette_right,
    ):
        return _revision_for_pipette(
            version_cache, PipetteType(version_cache.subidentifier)
        )
    else:
        return _revision_for_core_or_gripper(version_cache)


def _update_details_for_device(
    version_cache: DeviceInfoCache,
) -> Tuple[FirmwareUpdateType, str]:
    if version_cache.target in NodeId:
        node = NodeId(version_cache.target)
        return FirmwareUpdateType.from_node_info(
            node, version_cache.subidentifier
        ), _revision(version_cache)
    else:
        return FirmwareUpdateType.from_usb_target(
            USBTarget(version_cache.target)
        ), _revision_for_core_or_gripper(version_cache)


def _update_type_for_device(
    version_cache: DeviceInfoCache,
) -> Tuple[FirmwareUpdateType, str]:
    try:
        update_type, revision = _update_details_for_device(version_cache)
    except KeyError:
        log.error(
            f"Node {version_cache.target.name} has no revision or default revision and cannot be updated"
        )
        return (FirmwareUpdateType.unknown_no_revision, "")
    except ValueError:
        log.error(
            f"Target {version_cache.target.name} has no known subtype and cannot be updated"
        )
        return (FirmwareUpdateType.unknown_no_subtype, "")
    return update_type, revision


def _update_types_from_devices(
    devices: Iterable[DeviceInfoCache],
) -> Iterator[Tuple[DeviceInfoCache, FirmwareUpdateType, str]]:
    for version_cache in devices:
        log.debug(f"Checking firmware update for {version_cache.target.name}")
        # skip pipettes that dont have a PipetteType
        update_type, rev = _update_type_for_device(version_cache)
        yield (version_cache, update_type, rev)


def _devices_to_check(
    device_info: Dict[FirmwareTarget, DeviceInfoCache],
    targets: Optional[Set[FirmwareTarget]],
) -> Iterator[DeviceInfoCache]:
    known_targets = set(device_info.keys())
    check_targets = (
        known_targets.intersection(targets) if (targets is not None) else known_targets
    )
    return (device_info[target] for target in check_targets)


def _should_update(
    version_cache: DeviceInfoCache,
    update_info: UpdateInfo,
    force: bool,
) -> bool:
    if version_cache.target.is_bootloader():
        log.info(f"Update required for {version_cache.target.name} (in bootloader)")
        return True
    if force:
        log.info(f"Update required for {version_cache.target.name} (forced)")
        return True
    if version_cache.shortsha != update_info.shortsha:
        log.info(
            f"Update required for {version_cache.target.name} (reported sha {version_cache.shortsha} != {update_info.shortsha})"
        )
        return True
    log.info(
        f"No update required for {version_cache.target.name}, sha {version_cache.shortsha} matches and not forced"
    )
    return False


def _update_info_for_type(
    known_firmware: Dict[FirmwareUpdateType, UpdateInfo],
    update_type: Optional[FirmwareUpdateType],
) -> Optional[UpdateInfo]:
    # Given the update_type find the corresponding updateInfo, monadically on update_info
    if not update_type or update_type.value <= FirmwareUpdateType.unknown.value:
        return None
    try:
        update_info = known_firmware[update_type]
    except KeyError:
        log.error(f"No firmware update found with update type {update_type}")
        return None
    return update_info


def _update_files_from_types(
    info: Iterable[Tuple[FirmwareTarget, int, Dict[str, str], str]]
) -> Iterator[Tuple[FirmwareTarget, int, str]]:
    for target, next_version, files_by_revision, revision in info:
        # if we have a force set, we always update (we're only checking nodes in the force set anyway)
        try:
            yield target, next_version, files_by_revision[revision]
        except KeyError:
            log.error(f"No available firmware for revision {revision}")


def _info_for_required_updates(
    force: bool,
    known_firmware: Dict[FirmwareUpdateType, UpdateInfo],
    details: Iterable[Tuple[DeviceInfoCache, FirmwareUpdateType, str]],
) -> Iterator[Tuple[FirmwareTarget, int, Dict[str, str], str]]:
    for version_cache, update_type, rev in details:
        update_info = _update_info_for_type(known_firmware, update_type)
        if not update_info:
            continue
        if _should_update(version_cache, update_info, force):
            yield version_cache.target, update_info.version, update_info.files_by_revision, rev


def check_firmware_updates(
    device_info: Dict[FirmwareTarget, DeviceInfoCache],
    targets: Optional[Set[FirmwareTarget]] = None,
    force: bool = False,
) -> Dict[FirmwareTarget, Tuple[int, str]]:
    """Returns a dict of NodeIds that require a firmware update and the path to the file to update them."""
    known_firmware = load_firmware_manifest()
    if known_firmware is None:
        log.error("Could not load the known firmware.")
        return
    devices_to_check = _devices_to_check(device_info, targets)
    update_types = _update_types_from_devices(devices_to_check)
    update_info = _info_for_required_updates(force, known_firmware, update_types)
    update_files = _update_files_from_types(update_info)
    return {
        node: (next_version, filepath) for node, next_version, filepath in update_files
    }


class UpdateChecker(Protocol):
    """Protocol for check_firmware_updates to make putting it in a class easier."""

    def __call__(
        self,
        device_info: Dict[FirmwareTarget, DeviceInfoCache],
        targets: Optional[Set[FirmwareTarget]] = None,
        force: bool = False,
    ) -> Dict[FirmwareTarget, Tuple[int, str]]:
        """Check for firmware updates."""
        ...
