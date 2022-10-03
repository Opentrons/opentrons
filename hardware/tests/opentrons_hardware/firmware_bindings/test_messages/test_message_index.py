import pytest
import asyncio
from typing import List, Callable
from mock import AsyncMock

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings import (
    ArbitrationId,
    ArbitrationIdParts,
    utils,
)
from opentrons_hardware.firmware_bindings.messages import (
    MessageDefinition,
    message_definitions,
    payloads,
)

def test_unqiue_index() -> None:
    last_index = 0;
    for i in range (1, 20):
        message=message_definitions.HeartbeatRequest()
        assert message.message_index != last_index
        last_index = message.message_index


