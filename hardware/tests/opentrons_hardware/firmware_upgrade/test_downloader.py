"""Tests for the firmware downloader."""
from typing import List

import pytest
from mock import AsyncMock, MagicMock

from opentrons_hardware.firmware_upgrade import downloader
from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.firmware_upgrade.hex_file import HexRecordProcessor, Chunk


@pytest.fixture
def mock_messenger() -> AsyncMock:
    """Mock can messenger."""
    return AsyncMock(spec=CanMessenger)


@pytest.fixture
def mock_hex_processor() -> MagicMock:
    """Mock hex file record producer."""
    return MagicMock(spec=HexRecordProcessor)


@pytest.fixture
def chunks() -> List[Chunk]:
    """Data chunks produced by hex processor."""
    return [
        Chunk(address=0x000, data=list(range(56))),
        Chunk(address=0x100, data=[5, 6, 7, 8]),
        Chunk(address=0x200, data=[100, 1002]),
    ]


@pytest.fixture
def subject(mock_messenger: AsyncMock) -> downloader.FirmwareUpgradeDownloader:
    """Test subject."""
    return downloader.FirmwareUpgradeDownloader(mock_messenger)


def