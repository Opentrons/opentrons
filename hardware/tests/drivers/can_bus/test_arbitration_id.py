"""Arbitration id tests."""
import pytest
from hardware.drivers.can_bus.arbitration_id import ArbitrationId, ArbitrationIdParts


@pytest.mark.parametrize(
    argnames=["arbitration_id", "expected"],
    argvalues=[
        [0x0, ArbitrationIdParts(function_code=0x0, node_id=0x0, message_id=0)],
        [
            0xFFFFFFFF,
            ArbitrationIdParts(function_code=0x7F, node_id=0xFF, message_id=0x3FFF),
        ],
        [0x20181, ArbitrationIdParts(function_code=0x1, node_id=0x3, message_id=0x4)],
    ],
)
def test_arbitration_id_parts(
    arbitration_id: int, expected: ArbitrationIdParts
) -> None:
    """It should convert arbitration id to its parts."""
    c = ArbitrationId(id=arbitration_id)
    assert c.parts == expected


@pytest.mark.parametrize(
    argnames=["expected", "parts"],
    argvalues=[
        [0x0, ArbitrationIdParts(function_code=0x0, node_id=0x0, message_id=0)],
        [
            0x1FFFFFFF,
            ArbitrationIdParts(function_code=0x7F, node_id=0xFF, message_id=0x3FFF),
        ],
        [0x20181, ArbitrationIdParts(function_code=0x1, node_id=0x3, message_id=0x4)],
    ],
)
def test_arbitration_id_integer(expected: int, parts: ArbitrationIdParts) -> None:
    """It should convert parts to an arbitration id."""
    c = ArbitrationId(parts=parts)
    assert c.id == expected
