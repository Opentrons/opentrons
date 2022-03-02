"""Tests for Tool Detector."""
import pytest
from mock import patch
from opentrons_hardware.hardware_control.tools import detector
from opentrons_hardware.hardware_control.tools.types import Carrier
from opentrons_hardware.firmware_bindings.constants import ToolType
from opentrons_hardware.firmware_bindings.utils import UInt8Field
from opentrons_hardware.firmware_bindings.messages import message_definitions, payloads
from opentrons_hardware.drivers.can_bus import CanMessenger


@pytest.fixture
def subject() -> detector.ToolDetector:
    """The test subject."""
    tool_dict = {
        Carrier.Z_CARRIER: ToolType(0),
        Carrier.A_CARRIER: ToolType(0),
        Carrier.GRIPPER_CARRIER: ToolType(0),
    }
    with patch(
        "opentrons_hardware.drivers.can_bus.abstract_driver.AbstractCanDriver"
    ) as mock:
        response = message_definitions.PushToolsDetectedNotification(
            payload=payloads.ToolsDetectedNotificationPayload(
                z_motor=UInt8Field(1), a_motor=UInt8Field(1), gripper=UInt8Field(5)
            )
        )
        mock.__aiter__.return_value = [response]
        can_messenger_with_mocked_driver = CanMessenger(mock)
        return detector.ToolDetector(can_messenger_with_mocked_driver, tool_dict)


async def test_messaging(subject: detector.ToolDetector) -> None:
    """Test attached_tools changes to values rcvd in notification."""
    await subject.run(1, 1)
    tool_dict = {
        Carrier.Z_CARRIER: ToolType(1),
        Carrier.A_CARRIER: ToolType(1),
        Carrier.GRIPPER_CARRIER: ToolType(5),
    }
    assert subject._attached_tools == tool_dict
