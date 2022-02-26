"""Tests for Tool Detector."""
import pytest
from mock import AsyncMock
from opentrons_hardware.hardware_control.tools import detector
from opentrons_hardware.hardware_control.tools.types import Carrier
from opentrons_hardware.firmware_bindings.constants import ToolType
from tests.conftest import MockCanDriver


@pytest.fixture
def subject(mock_messenger: AsyncMock) -> detector.ToolDetector:
    """The test subject."""
    tool_dict = {
        Carrier.LEFT: ToolType(0),
        Carrier.RIGHT: ToolType(0),
    }
    return detector.ToolDetector(mock_messenger, tool_dict)


async def test_messaging(
    subject: detector.ToolDetector,
    mock_driver: MockCanDriver,
) -> None:
    """Test attached_tools changes to values rcvd in notification."""
    await subject.run(1, 1, mock_driver)
    tool_dict = {
        Carrier.LEFT: ToolType(1),
        Carrier.RIGHT: ToolType(1),
    }
    assert subject._attached_tools == tool_dict
