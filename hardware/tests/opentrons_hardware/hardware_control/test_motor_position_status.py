"""Tests for the motor position status tools."""
import pytest
from typing import Tuple, List, Any
import asyncio

from opentrons_hardware.firmware_bindings.utils import (
    UInt32Field,
    Int32Field,
)
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions as md,
)
from opentrons_hardware.firmware_bindings.messages.fields import MotorPositionFlagsField
from opentrons_hardware.firmware_bindings.messages.payloads import (
    MotorPositionResponse as motor_payload,
)
from opentrons_hardware.firmware_bindings.arbitration_id import (
    ArbitrationId,
    ArbitrationIdParts,
)

from opentrons_hardware.hardware_control import motor_position_status
from opentrons_hardware.hardware_control.types import MotorPositionStatus


def motor_position_response() -> md.MotorPositionResponse:
    """Create a generic motor response."""
    return md.MotorPositionResponse(
        payload=motor_payload(
            UInt32Field(123), Int32Field(123), MotorPositionFlagsField(1)
        )
    )


def arb_id(node: NodeId) -> ArbitrationId:
    """Create an arbitration ID from a specific node."""
    return ArbitrationId(
        ArbitrationIdParts(
            message_id=1, node_id=NodeId.host, function_code=0, originating_node_id=node
        )
    )


class AsyncIter:
    """Class to provide an async iterator over a list."""

    def __init__(
        self, items: List[Tuple[md.MotorPositionResponse, ArbitrationId]]
    ) -> None:
        """Create an async iterator over a list."""
        self.items = items

    async def __aiter__(self) -> Any:
        """Async generator for the collection."""
        for item in self.items:
            yield item
            await asyncio.sleep(0)


@pytest.fixture
def waitable_reader() -> AsyncIter:
    """Fixture to create an async iterator for the parser."""
    return AsyncIter(
        items=[
            (motor_position_response(), arb_id(NodeId.gantry_x)),
            (motor_position_response(), arb_id(NodeId.gantry_y)),
            (motor_position_response(), arb_id(NodeId.head)),
        ]
    )


async def test_parse_motor_position(waitable_reader: AsyncIter) -> None:
    """Test the motor parser."""
    nodes = set([NodeId.gantry_x, NodeId.gantry_y, NodeId.head])
    data = await asyncio.wait_for(
        motor_position_status._parser_motor_position_response(
            waitable_reader  # type: ignore[arg-type]
        ),
        1,
    )
    expected = MotorPositionStatus(0.123, 0.123, True, False)
    for n in nodes:
        assert data.get(n) == expected
