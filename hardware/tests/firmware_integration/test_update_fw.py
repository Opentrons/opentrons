"""Tests for fw update."""
import os
from pathlib import Path

import pytest

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.firmware_update import HexRecordProcessor, run_update, pipette_left, Target


@pytest.fixture
def target() -> Target:
    """Target node."""
    return pipette_left


@pytest.fixture
def hex_file_path() -> Path:
    """Path of hex file for test."""
    tt = os.path.dirname(__file__)
    path = Path(os.path.abspath(tt))
    return path / Path("bootloader-head.hex")


@pytest.mark.requires_emulator
async def test_update(
    can_messenger: CanMessenger, target: Target,
    hex_file_path: Path
) -> None:
    """It should complete the download."""
    await run_update(
        messenger=can_messenger,
        target=target,
        hex_processor=HexRecordProcessor.from_file(hex_file_path),
        retry_count=3,
        timeout_seconds=60,
        erase=True
    )
