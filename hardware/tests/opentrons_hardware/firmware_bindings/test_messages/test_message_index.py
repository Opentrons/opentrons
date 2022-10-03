"""Tests for can message_index generator."""
from opentrons_hardware.firmware_bindings import utils

from opentrons_hardware.firmware_bindings.messages import message_definitions


def test_unqiue_index() -> None:
    """Create several messages and make sure they have generate a new index."""
    last_index = utils.UInt32Field(0)
    for i in range(1, 20):
        message = message_definitions.HeartbeatRequest()
        assert message.message_index != last_index
        last_index = message.message_index
