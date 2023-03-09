"""This module provides utilities for the firmware update module."""


from dataclasses import dataclass
from typing_extensions import Final
from enum import Enum
import json
import logging
import os
from pathlib import Path
from typing import (
    Any,
    Dict,
    Optional,
    Set,
    Union,
    Tuple,
    Iterable,
    Iterator,
)
from opentrons_hardware.firmware_bindings.constants import (
    FirmwareTarget,
    NodeId,
    PipetteType,
)
from opentrons_hardware.hardware_control.network import DeviceInfoCache


_FIRMWARE_MANIFEST_PATH: Final = os.path.abspath(
    "/usr/lib/firmware/opentrons-firmware.json"
)

_DEFAULT_PCBA_REVS: Final[Dict[NodeId, str]] = {
    NodeId.head: "c2",
    NodeId.head_bootloader: "c2",
    NodeId.gantry_x: "c1",
    NodeId.gantry_x_bootloader: "c1",
    NodeId.gantry_y: "c1",
    NodeId.gantry_y_bootloader: "c1",
    NodeId.gripper: "c1",
    NodeId.gripper_bootloader: "c1",
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
    def from_node(cls, node: NodeId) -> "FirmwareUpdateType":
        """Return FirmwareUpdateType with given node."""
        lookup = {
            NodeId.head: cls.head,
            NodeId.gantry_x: cls.gantry_x,
            NodeId.gantry_y: cls.gantry_y,
            NodeId.gripper: cls.gripper,
        }
        return lookup.get(node, cls.unknown)

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
    return device_info.revision.main or _DEFAULT_PCBA_REVS[device_info.node_id]


def _revision_for_pipette(
    pipette_type: PipetteType, device_info: DeviceInfoCache
) -> str:
    """Returns the appropriate defaulted revision for a pipette.

    The default revision can be determined solely from the pipette type. This is
    needed because PCBAs of the default revision were built before revision handling
    was introduced, and cannot be updated because too many were made.
    """
    return device_info.revision.main or _DEFAULT_PCBA_REVS_PIPETTE[pipette_type]


def _update_details_for_device(
    attached_pipettes: Dict[NodeId, PipetteType],
    version_cache: DeviceInfoCache,
) -> Tuple[FirmwareUpdateType, str]:
    if version_cache.node_id in attached_pipettes:
        pipette_type = attached_pipettes[version_cache.node_id]
        return FirmwareUpdateType.from_pipette(pipette_type), _revision_for_pipette(
            pipette_type, version_cache
        )
    else:
        return FirmwareUpdateType.from_node(
            version_cache.node_id
        ), _revision_for_core_or_gripper(version_cache)


def _update_type_for_device(
    attached_pipettes: Dict[NodeId, PipetteType],
    version_cache: DeviceInfoCache,
) -> Union[Tuple[FirmwareUpdateType, str], Tuple[None, None]]:
    try:
        update_type, revision = _update_details_for_device(
            attached_pipettes, version_cache
        )
    except KeyError:
        log.error(
            f"Node {version_cache.node_id.name} (pipette {attached_pipettes.get(version_cache.node_id, None)}) "
            "has no revision or default revision"
        )
        return None, None
    return update_type, revision


def _update_types_from_devices(
    attached_pipettes: Dict[NodeId, PipetteType],
    devices: Iterable[DeviceInfoCache],
) -> Iterator[Tuple[DeviceInfoCache, FirmwareUpdateType, str]]:
    for version_cache in devices:
        log.debug(f"Checking firmware update for {version_cache.node_id.name}")
        # skip pipettes that dont have a PipetteType
        node_id = version_cache.node_id
        if node_id in [
            NodeId.pipette_left,
            NodeId.pipette_right,
        ] and not attached_pipettes.get(node_id):
            continue
        update_type, rev = _update_type_for_device(attached_pipettes, version_cache)
        if not rev or not update_type:
            continue
        yield (version_cache, update_type, rev)


def _devices_to_check(
    device_info: Dict[NodeId, DeviceInfoCache], nodes: Set[NodeId]
) -> Iterator[DeviceInfoCache]:
    known_nodes = set(device_info.keys())
    check_nodes = known_nodes.intersection(nodes) if nodes else known_nodes
    return (device_info[node] for node in check_nodes)


def _should_update(
    version_cache: DeviceInfoCache,
    update_info: UpdateInfo,
    force: bool,
) -> bool:
    if force:
        log.info(f"Update required for {version_cache.node_id} (forced)")
        return True
    if version_cache.shortsha != update_info.shortsha:
        log.info(
            f"Update required for {version_cache.node_id} (reported sha {version_cache.shortsha} != {update_info.shortsha})"
        )
        return True
    log.info(
        f"No update required for {version_cache.node_id}, sha {version_cache.shortsha} matches and not forced"
    )
    return False


def _update_info_for_type(
    known_firmware: Dict[FirmwareUpdateType, UpdateInfo],
    update_type: Optional[FirmwareUpdateType],
) -> Optional[UpdateInfo]:
    # Given the update_type find the corresponding updateInfo, monadically on update_info
    if not update_type:
        return None
    try:
        update_info = known_firmware[update_type]
    except KeyError:
        log.error(f"No firmware update found with update type {update_type}")
        return None
    return update_info


def _update_files_from_types(
    info: Iterable[Tuple[NodeId, int, Dict[str, str], str]]
) -> Iterator[Tuple[NodeId, int, str]]:
    for node, next_version, files_by_revision, revision in info:
        # if we have a force set, we always update (we're only checking nodes in the force set anyway)
        try:
            yield node, next_version, files_by_revision[revision]
        except KeyError:
            log.error(f"No available firmware for revision {revision}")


def _info_for_required_updates(
    force: bool,
    known_firmware: Dict[FirmwareUpdateType, UpdateInfo],
    details: Iterable[Tuple[DeviceInfoCache, FirmwareUpdateType, str]],
) -> Iterator[Tuple[NodeId, int, Dict[str, str], str]]:
    for version_cache, update_type, rev in details:
        update_info = _update_info_for_type(known_firmware, update_type)
        if not update_info:
            continue
        if _should_update(version_cache, update_info, force):
            yield version_cache.node_id, update_info.version, update_info.files_by_revision, rev


def check_firmware_updates(
    device_info: Dict[NodeId, DeviceInfoCache],
    attached_pipettes: Dict[NodeId, PipetteType],
    nodes: Optional[Set[NodeId]] = None,
    force: bool = False,
) -> Dict[FirmwareTarget, Tuple[int, str]]:
    """Returns a dict of NodeIds that require a firmware update and the path to the file to update them."""
    nodes = nodes or set()

    known_firmware = load_firmware_manifest()
    if known_firmware is None:
        log.error("Could not load the known firmware.")
        return
    devices_to_check = _devices_to_check(device_info, nodes)
    update_types = _update_types_from_devices(attached_pipettes, devices_to_check)
    update_info = _info_for_required_updates(force, known_firmware, update_types)
    update_files = _update_files_from_types(update_info)
    return {
        node: (next_version, filepath) for node, next_version, filepath in update_files
    }
