from typing import Dict

import mock
import pytest

from decoy import Decoy
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.hardware_control.network import DeviceInfoCache
from opentrons_hardware.firmware_update.utils import FirmwareUpdateType, UpdateInfo


@pytest.fixture
def controller(decoy: Decoy) -> OT3Controller:
    return decoy.mock(cls=OT3Controller)


@pytest.fixture
def fw_node_info() -> Dict[NodeId, DeviceInfoCache]:
    node_cache1 = DeviceInfoCache(
        NodeId.head, 1, "12345678", None, PCBARevision(None), subidentifier=0, ok=True
    )
    node_cache2 = DeviceInfoCache(
        NodeId.gantry_x,
        1,
        "12345678",
        None,
        PCBARevision(None),
        subidentifier=0,
        ok=True,
    )
    return {NodeId.head: node_cache1, NodeId.gantry_x: node_cache2}


async def test_update_firmware_update_required(
    controller: OT3Controller, fw_update_info: Dict[NodeId, str], fw_node_info
) -> None:
    """Test that updates are started when shortsha's dont match."""

    # no updates have been started, but lets set this to true so we can assert later on
    controller._subsystem_manager.update_required.return_value = True
    controller.initialized = True
    controller._network_info._device_info_cache = fw_node_info
    check_fw_update_return = {
        NodeId.head: (1, "/some/path/head.hex"),
        NodeId.gantry_x: (1, "/some/path/gantry.hex"),
    }
    with mock.patch(
        "opentrons_hardware.firmware_update.check_firmware_updates",
        mock.Mock(return_value=check_fw_update_return),
    ), mock.patch(
        "opentrons_hardware.firmware_update.RunUpdate"
    ) as run_updates, mock.patch.object(
        controller._network_info, "probe"
    ) as probe:
        async for status_element in controller.update_firmware({}):
            pass
        run_updates.assert_called_with(
            can_messenger=controller._messenger,
            usb_messenger=controller._usb_messenger,
            update_details=fw_update_info,
            retry_count=mock.ANY,
            timeout_seconds=mock.ANY,
            erase=True,
        )

        assert not controller.update_required
        probe.assert_called_once()


async def test_update_firmware_up_to_date(
    controller: OT3Controller,
    fw_update_info: Dict[NodeId, str],
) -> None:
    """Test that updates are not started if they are not required."""
    with mock.patch(
        "opentrons_hardware.firmware_update.RunUpdate.run_updates"
    ) as run_updates, mock.patch.object(
        controller._network_info, "probe"
    ) as probe, mock.patch(
        "opentrons_hardware.firmware_update.check_firmware_updates",
        mock.Mock(return_value={}),
    ):
        async for status_element in controller.update_firmware({}):
            pass
        assert not controller.update_required
        run_updates.assert_not_called()
        probe.assert_not_called()


async def test_update_firmware_specified_nodes(
    controller: OT3Controller,
    fw_node_info: Dict[NodeId, DeviceInfoCache],
    fw_update_info: Dict[NodeId, str],
) -> None:
    """Test that updates are started if nodes are NOT out-of-date when nodes are specified."""
    for node_cache in fw_node_info.values():
        node_cache.shortsha = "978abcde"

    check_fw_update_return = {
        NodeId.head: (1, "/some/path/head.hex"),
        NodeId.gantry_x: (1, "/some/path/gantry.hex"),
    }
    controller._network_info._device_info_cache = fw_node_info

    with mock.patch(
        "opentrons_hardware.firmware_update.check_firmware_updates",
        mock.Mock(return_value=check_fw_update_return),
    ) as check_updates, mock.patch(
        "opentrons_hardware.firmware_update.RunUpdate"
    ) as run_updates, mock.patch.object(
        controller._network_info, "probe"
    ) as probe:
        async for status_element in controller.update_firmware(
            {}, targets={NodeId.head, NodeId.gantry_x}
        ):
            pass
        check_updates.assert_called_with(
            fw_node_info, {}, targets={NodeId.head, NodeId.gantry_x}, force=False
        )
        run_updates.assert_called_with(
            can_messenger=controller._messenger,
            usb_messenger=controller._usb_messenger,
            update_details=fw_update_info,
            retry_count=mock.ANY,
            timeout_seconds=mock.ANY,
            erase=True,
        )

        assert not controller.update_required
        probe.assert_called_once()


async def test_update_firmware_invalid_specified_node(
    controller: OT3Controller,
    fw_node_info: Dict[NodeId, DeviceInfoCache],
    fw_update_info: Dict[FirmwareUpdateType, UpdateInfo],
) -> None:
    """Test that only nodes in device_info_cache are updated when nodes are specified."""
    check_fw_update_return = {
        NodeId.head: (1, "/some/path/head.hex"),
        NodeId.gantry_x: (1, "/some/path/gantry.hex"),
    }
    controller._network_info._device_info_cache = fw_node_info
    with mock.patch(
        "opentrons_hardware.firmware_update.check_firmware_updates",
        mock.Mock(return_value=check_fw_update_return),
    ), mock.patch(
        "opentrons_hardware.firmware_update.RunUpdate"
    ) as run_updates, mock.patch.object(
        controller._network_info, "probe"
    ) as probe:
        async for status_element in controller.update_firmware(
            {}, targets={NodeId.head}
        ):
            pass
        run_updates.assert_called_with(
            can_messenger=controller._messenger,
            usb_messenger=controller._usb_messenger,
            update_details=fw_update_info,
            retry_count=mock.ANY,
            timeout_seconds=mock.ANY,
            erase=True,
        )

        assert not controller.update_required
        probe.assert_called_once()
