"""Tests for fw update."""
import os
from pathlib import Path

import pytest
from typing import Dict

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.firmware_bindings import NodeId, FirmwareTarget, USBTarget
from opentrons_hardware.firmware_update import RunUpdate


@pytest.fixture
def system_node_id() -> NodeId:
    """Target node."""
    return NodeId.pipette_left


@pytest.fixture
def hex_file_path() -> str:
    """Path of hex file for test."""
    tt = os.path.dirname(__file__)
    path = Path(os.path.abspath(tt))
    return str(path / Path("bootloader-head.hex"))


@pytest.fixture
def system_usb_target() -> USBTarget:
    """Target node."""
    return USBTarget.rear_panel


@pytest.fixture
def bin_file_path() -> str:
    """Path of hex file for test."""
    tt = os.path.dirname(__file__)
    path = Path(os.path.abspath(tt))
    return str(path / Path("rear-panel-b1.bin"))


@pytest.mark.requires_emulator
async def test_can_update(
    can_messenger: CanMessenger,
    usb_messenger: BinaryMessenger,
    system_node_id: NodeId,
    hex_file_path: str,
) -> None:
    """It should complete the download."""
    update_details: Dict[FirmwareTarget, str] = {
        system_node_id: hex_file_path,
    }
    updater = RunUpdate(
        can_messenger=can_messenger,
        usb_messenger=usb_messenger,
        update_details=update_details,
        retry_count=3,
        timeout_seconds=60,
        erase=True,
    )
    await updater._run_can_update(
        messenger=can_messenger,
        node_id=system_node_id,
        filepath=hex_file_path,
        retry_count=3,
        timeout_seconds=60,
        erase=True,
    )


@pytest.mark.requires_emulator
async def test_usb_update(
    can_messenger: CanMessenger,
    usb_messenger: BinaryMessenger,
    system_usb_target: USBTarget,
    bin_file_path: str,
) -> None:
    """It should complete the download."""
    update_details: Dict[FirmwareTarget, str] = {
        system_usb_target: bin_file_path,
    }
    updater = RunUpdate(
        can_messenger=can_messenger,
        usb_messenger=usb_messenger,
        update_details=update_details,
        retry_count=3,
        timeout_seconds=60,
        erase=True,
    )
    await updater._run_usb_update(
        messenger=usb_messenger,
        retry_count=3,
        update_file=bin_file_path,
        usb_target=system_usb_target,
    )
