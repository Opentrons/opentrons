"""Tests for the firmware downloader."""

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
def subject(mock_messenger: AsyncMock) -> downloader.FirmwareUpgradeDownloader:
    """Test subject."""
    return downloader.FirmwareUpgradeDownloader(mock_messenger)


