"""Tests for fw update."""
import os
from pathlib import Path

import pytest

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.firmware_bindings import NodeId
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


@pytest.mark.requires_emulator
async def test_update(
    can_messenger: CanMessenger, system_node_id: NodeId, hex_file_path: str
) -> None:
    """It should complete the download."""
    update_details = {
        system_node_id: hex_file_path,
    }
    updater = RunUpdate(
        messenger=can_messenger,
        update_details=update_details,
        retry_count=3,
        timeout_seconds=60,
        erase=True,
    )
    await updater._run_update(
        messenger=can_messenger,
        node_id=system_node_id,
        filepath=hex_file_path,
        retry_count=3,
        timeout_seconds=60,
        erase=True,
    )
