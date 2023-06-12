"""Test the utils module."""


import json
import os
import secrets
from typing import Any, Dict, Optional
import mock
import pytest
from typing import cast
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    PipetteType,
    FirmwareTarget,
    USBTarget,
)
from opentrons_hardware.hardware_control.types import PCBARevision

from opentrons_hardware.firmware_update.utils import (
    FirmwareUpdateType,
    UpdateInfo,
    load_firmware_manifest,
    check_firmware_updates,
    _DEFAULT_PCBA_REVS,
    _DEFAULT_PCBA_REVS_PIPETTE,
    _update_type_for_device,
    _update_files_from_types,
)
from opentrons_hardware.hardware_control.network import DeviceInfoCache


manifest_filename = "opentrons-manifest-test.json"


@pytest.fixture
def mock_manifest() -> Dict[str, Any]:
    """Mock firmware manifest file."""
    return {
        "manifest_version": 1,
        "subsystems": {
            "head": {
                "version": 2,
                "shortsha": "25755efd",
                "files_by_revision": {"c1": "head-c1.hex"},
            }
        },
        "usb_subsystems": {
            "rear-panel": {
                "version": 2,
                "shortsha": "9d6b5248",
                "files_by_revision": {"c1": "rear-panel-b1.bin"},
            }
        },
    }


def generate_device_info(
    manifest: Dict[str, Any],
    random_sha: Optional[bool] = False,
    revision: Optional[str] = "c1",
) -> Dict[FirmwareTarget, DeviceInfoCache]:
    """Helper function to generate device info."""
    device_info_cache: Dict[FirmwareTarget, DeviceInfoCache] = {}
    for subsystem, info in manifest["subsystems"].items():
        node_id = NodeId.__members__[subsystem.replace("-", "_")]
        version = info["version"]
        shortsha = secrets.token_hex(4) if random_sha else info["shortsha"]
        device_info_cache.update(
            {
                node_id: DeviceInfoCache(
                    node_id,
                    version,
                    shortsha,
                    None,
                    PCBARevision(revision, None),
                    subidentifier=0,
                    ok=True,
                )
            }
        )
    for subsystem, info in manifest.get("usb_subsystems", {}).items():
        target = USBTarget.__members__[subsystem.replace("-", "_")]
        version = info["version"]
        shortsha = secrets.token_hex(4) if random_sha else info["shortsha"]
        device_info_cache.update(
            {
                target: DeviceInfoCache(
                    target,
                    version,
                    shortsha,
                    None,
                    PCBARevision(revision, None),
                    subidentifier=0,
                    ok=True,
                )
            }
        )
    return device_info_cache


def generate_update_info(
    manifest: Dict[str, Any], random_sha: Optional[bool] = False
) -> Dict[FirmwareUpdateType, UpdateInfo]:
    """Helper function to generate update info."""
    update_info: Dict[FirmwareUpdateType, UpdateInfo] = {}
    for subsystem, info in manifest["subsystems"].items():
        update_type = FirmwareUpdateType.from_name(subsystem)
        version = info["version"]
        shortsha = secrets.token_hex(4) if random_sha else info["shortsha"]
        files_by_revision = info["files_by_revision"]
        update_info.update(
            {update_type: UpdateInfo(update_type, version, shortsha, files_by_revision)}
        )
    for usbsubsystem, info in manifest.get("usb_subsystems", {}).items():
        update_type = FirmwareUpdateType.from_name(usbsubsystem)
        version = info["version"]
        shortsha = secrets.token_hex(4) if random_sha else info["shortsha"]
        files_by_revision = info["files_by_revision"]
        update_info.update(
            {update_type: UpdateInfo(update_type, version, shortsha, files_by_revision)}
        )
    return update_info


@pytest.mark.parametrize("node", list(NodeId))
def all_nodes_covered_by_defaults(node: NodeId) -> None:
    """Every non-pipette node should have a default for its node id and bootloader."""
    assert node.application_for() in _DEFAULT_PCBA_REVS or "pipette" in node.name


@pytest.mark.parametrize("pipette_type", list(PipetteType))
def all_pipette_types_covered_by_defaults(pipette: PipetteType) -> None:
    """Every pipette type should have a default for its pipette type."""
    assert pipette in _DEFAULT_PCBA_REVS_PIPETTE


@pytest.mark.parametrize(
    "node,default_rev",
    [(node, default_rev) for node, default_rev in _DEFAULT_PCBA_REVS.items()]
    + [
        (cast(NodeId, node).bootloader_for(), default_rev)
        for node, default_rev in _DEFAULT_PCBA_REVS.items()
        if node in NodeId
    ],
)
@pytest.mark.parametrize("reported_rev", ["a1", "b2", None])
def test_revision_defaulting_for_core(
    node: NodeId, default_rev: str, reported_rev: Optional[str]
) -> None:
    """We should pass through non-default revs and default ones that are not present."""
    _, rev = _update_type_for_device(
        DeviceInfoCache(
            node,
            2,
            "abcdef12",
            None,
            PCBARevision(main=reported_rev),
            subidentifier=0,
            ok=True,
        ),
    )
    if reported_rev:
        assert rev == reported_rev
    else:
        assert rev == default_rev


@pytest.mark.parametrize(
    "node",
    [
        NodeId.pipette_left,
        NodeId.pipette_left_bootloader,
        NodeId.pipette_right,
        NodeId.pipette_right_bootloader,
    ],
)
@pytest.mark.parametrize(
    "subidentifier",
    [pipette_type.value for pipette_type, _ in _DEFAULT_PCBA_REVS_PIPETTE.items()],
)
@pytest.mark.parametrize("reported_rev", ["a1", "b2", "c1"])
def test_revision_defaulting_for_pipette(
    node: NodeId,
    subidentifier: int,
    reported_rev: Optional[str],
) -> None:
    """We should pass through revisions."""
    _, rev = _update_type_for_device(
        DeviceInfoCache(
            node,
            2,
            "abcdef12",
            None,
            PCBARevision(main=reported_rev),
            subidentifier=subidentifier,
            ok=True,
        ),
    )
    assert rev == reported_rev


def test_firmware_file_selected_for_revision() -> None:
    """Given a device and revision, the right firmware file should be selected."""
    stimulus = [
        # a matching rev should be found
        (NodeId.head, 0, {"a1": "test-head.hex", "b1": "test-head-wrong.hex"}, "a1"),
        # an empty revs dict should be ignored
        (NodeId.gantry_x, 2, {"": ""}, "a1"),
        # a present but non matching revs dict should be ignored
        (NodeId.gantry_y, 1, {"b1": "test-gantry-y.hex"}, "c1"),
    ]
    response = list(_update_files_from_types(stimulus))
    assert response == [(NodeId.head, 0, "test-head.hex")]


def test_load_firmware_manifest_success(mock_manifest: Dict[str, Any]) -> None:
    """Test that we can serialize a manifest file from disk."""
    expected = generate_update_info(mock_manifest)
    # save file
    with open(manifest_filename, "w") as fp:
        json.dump(mock_manifest, fp)

    # test that the file written to disk can be deserialized
    with mock.patch("os.path.exists"):
        updates = load_firmware_manifest(manifest_filename)
        assert updates
        for update_type, update_info in updates.items():
            assert isinstance(update_type, FirmwareUpdateType)
            assert isinstance(update_info, UpdateInfo)
            expected_update_info = expected[update_type]
            assert expected_update_info
            assert expected_update_info.update_type == update_info.update_type
            assert expected_update_info.version == update_info.version
            assert expected_update_info.shortsha == update_info.shortsha
            assert (
                expected_update_info.files_by_revision == update_info.files_by_revision
            )
        os.unlink(manifest_filename)


def test_load_firmware_manifest_file_not_found(mock_manifest: Dict[str, Any]) -> None:
    """Test cases where we cant serialize the manifest file."""
    # return empty if manifest file does not exist
    updates = load_firmware_manifest("unknown-filename.json")
    assert updates == {}


def test_load_firmware_manifest_invalid_json() -> None:
    """Test loading invalid firmware json file."""
    with open(manifest_filename, "w") as fp:
        fp.write("asdasd")
    with mock.patch("os.path.exists"):
        updates = load_firmware_manifest(manifest_filename)
        assert updates == {}
    os.unlink(manifest_filename)


def test_load_firmware_manifest_unknown_update_type(
    mock_manifest: Dict[str, Any]
) -> None:
    """Test unknown update_type."""
    with open(manifest_filename, "w") as fp:
        manifest = mock_manifest.copy()
        manifest["subsystems"].update({"invalid_subsystem": {}})
        json.dump(manifest, fp)
    with mock.patch("os.path.exists"):
        updates = load_firmware_manifest(manifest_filename)
        # only two updates are valid 'head' and 'rear-panel', invalid update types are ignored
        assert FirmwareUpdateType.head in updates
        assert len(updates) == 2
        os.unlink(manifest_filename)


def test_load_firmware_manifest_invalid_update_info(
    mock_manifest: Dict[str, Any]
) -> None:
    """Test invalid update info."""
    with open(manifest_filename, "w") as fp:
        manifest = mock_manifest.copy()
        manifest["subsystems"]["gantry-x"] = {
            "version": None,
            "shortsha": "12345678",
            "files_by_revision": {"rev1": "some/path"},
        }
        manifest["subsystems"]["gantry-y"] = {
            "version": 2,
            "shortsha": "12345678",
            "files_by_revision": {},
        }
        manifest["subsystems"]["gripper"] = {
            "version": 2,
            "shortsha": None,
            "files_by_revision": {"rev1": "some/path"},
        }
        json.dump(manifest, fp)
    with mock.patch("os.path.exists"):
        updates = load_firmware_manifest(manifest_filename)
        # only two updates are valid 'head' and 'rear-panel', invalid update types are ignored
        assert FirmwareUpdateType.head in updates
        assert len(updates) == 2
        os.unlink(manifest_filename)


def test_load_firmware_manifest_binary_file_not_found(
    mock_manifest: Dict[str, Any]
) -> None:
    """Test binary update file not found."""
    with open(manifest_filename, "w") as fp:
        manifest = mock_manifest.copy()
        json.dump(manifest, fp)
    updates = load_firmware_manifest(manifest_filename)
    assert updates == {}
    os.unlink(manifest_filename)


def test_check_firmware_updates_available(mock_manifest: Dict[str, Any]) -> None:
    """Test that firmware updates are available when shortshas mismatch."""
    manifest = mock_manifest.copy()
    manifest["subsystems"].update(
        {
            "gantry-x": {
                "version": 2,
                "shortsha": "25755efd",
                "files_by_revision": {"c1": "gantry-x-rev1.hex"},
            },
            "gantry-y": {
                "version": 2,
                "shortsha": "25755efd",
                "files_by_revision": {"c1": "gantry-y-rev1.hex"},
            },
            "gripper": {
                "version": 2,
                "shortsha": "25755efd",
                "files_by_revision": {"c1": "gripper-rev1.hex"},
            },
        }
    )
    known_firmware_updates = generate_update_info(manifest)

    # test devices requiring firmware update when the shortshas dont match
    device_info_cache = generate_device_info(manifest, random_sha=True)
    with mock.patch(
        "opentrons_hardware.firmware_update.utils.load_firmware_manifest",
        mock.Mock(return_value=known_firmware_updates),
    ):
        firmware_updates = check_firmware_updates(device_info_cache)
        assert firmware_updates
        assert len(firmware_updates) == len(device_info_cache)
        for node_id in firmware_updates:
            assert node_id in device_info_cache


def test_check_firmware_updates_available_nodes_specified(
    mock_manifest: Dict[str, Any]
) -> None:
    """Test that only specified devices are updated if given."""
    manifest = mock_manifest.copy()
    manifest["subsystems"].update(
        {
            "gantry-x": {
                "version": 2,
                "shortsha": "25755efd",
                "files_by_revision": {"c1": "gantry-x-rev1.hex"},
            },
            "gantry-y": {
                "version": 2,
                "shortsha": "25755efd",
                "files_by_revision": {"c1": "gantry-y-rev1.hex"},
            },
            "gripper": {
                "version": 2,
                "shortsha": "25755efd",
                "files_by_revision": {"c1": "gripper-rev1.hex"},
            },
        }
    )
    device_info_cache = generate_device_info(manifest)
    # change the shortsha so they all require an update
    known_firmware_updates = generate_update_info(manifest, random_sha=True)
    with mock.patch(
        "opentrons_hardware.firmware_update.utils.load_firmware_manifest",
        mock.Mock(return_value=known_firmware_updates),
    ):
        firmware_updates = check_firmware_updates(
            device_info_cache, targets={NodeId.gripper}
        )
        # only the gripper needs an update
        assert len(firmware_updates) == 1
        assert NodeId.gripper in firmware_updates


def test_check_firmware_updates_available_forced(mock_manifest: Dict[str, Any]) -> None:
    """Test updates when force flag is set devices are updated regardless of the shortsha."""
    device_info_cache = generate_device_info(mock_manifest)
    known_firmware_updates = generate_update_info(mock_manifest)
    with mock.patch(
        "opentrons_hardware.firmware_update.utils.load_firmware_manifest",
        mock.Mock(return_value=known_firmware_updates),
    ):
        firmware_updates = check_firmware_updates(device_info_cache, force=True)
        assert firmware_updates
        assert len(firmware_updates) == len(device_info_cache)
        for node_id in firmware_updates:
            assert node_id in device_info_cache


def test_load_firmware_manifest_is_empty(mock_manifest: Dict[str, Any]) -> None:
    """Don't do updates if load_firmware_manifest is empty."""
    device_info_cache = generate_device_info(mock_manifest)
    with mock.patch(
        "opentrons_hardware.firmware_update.utils.load_firmware_manifest",
        mock.Mock(return_value={}),
    ):
        firmware_updates = check_firmware_updates(
            device_info_cache,
        )
        assert firmware_updates == {}


def test_unknown_firmware_update_type(mock_manifest: Dict[str, Any]) -> None:
    """Don't do updates if the FirmwareUpdateType is unknown."""
    device_info: Dict[FirmwareTarget, DeviceInfoCache] = {
        NodeId.head: DeviceInfoCache(
            NodeId.head,
            2,
            "12345678",
            None,
            PCBARevision(None),
            subidentifier=0,
            ok=False,
        )
    }
    known_firmware_updates = generate_update_info(mock_manifest)
    known_firmware_updates.pop(FirmwareUpdateType.head)
    with mock.patch(
        "opentrons_hardware.firmware_update.utils.load_firmware_manifest",
        mock.Mock(return_value={}),
    ):
        firmware_updates = check_firmware_updates(device_info)
        assert firmware_updates == {}
