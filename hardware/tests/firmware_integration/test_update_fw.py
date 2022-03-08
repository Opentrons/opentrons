"""Tests for fw update."""
import os
from pathlib import Path

import pytest
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    FirmwareUpdateInitiate,
)

from opentrons_hardware import firmware_update
from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.firmware_update import HexRecordProcessor


@pytest.fixture
def target() -> firmware_update.Target:
    """Target node."""
    return firmware_update.pipette_left


@pytest.fixture
async def downloader_subject(
    can_messenger: CanMessenger, target: firmware_update.Target
) -> firmware_update.FirmwareUpdateDownloader:
    """Test subject."""
    # Send initiate to the bootloader to start with a clean slate
    await can_messenger.send(
        node_id=target.bootloader_node,
        message=FirmwareUpdateInitiate(),
    )
    return firmware_update.FirmwareUpdateDownloader(messenger=can_messenger)


@pytest.fixture
def hex_file_path() -> Path:
    """Path of hex file for test."""
    tt = os.path.dirname(__file__)
    path = Path(os.path.abspath(tt))
    return path / Path("bootloader-head.hex")


async def test_download(
    downloader_subject: firmware_update.FirmwareUpdateDownloader,
    hex_file_path: Path,
    target: firmware_update.Target,
) -> None:
    """It should complete the download."""
    await downloader_subject.run(
        node_id=target.bootloader_node,
        hex_processor=HexRecordProcessor.from_file(hex_file_path),
        ack_wait_seconds=60,
    )
