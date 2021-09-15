"""Can Driver tests."""
import asyncio

import pytest
from can import Bus, Message

from hardware.drivers.can_bus.arbitration_id import ArbitrationId
from hardware.drivers.can_bus.driver import CanDriver
from hardware.drivers.can_bus.message import CanMessage


@pytest.fixture
def bus_channel() -> str:
    """The virtual can bus channel."""
    return "test_channel"


@pytest.fixture
def can_bus(bus_channel: str) -> Bus:
    """A virtual can bus fixture."""
    bus = Bus(bus_channel, bustype="virtual")
    yield bus
    bus.shutdown()


@pytest.fixture
async def subject(loop: asyncio.BaseEventLoop, bus_channel: str) -> CanDriver:
    """The can driver under test."""
    return CanDriver(bus=Bus(bus_channel, bustype="virtual"), loop=loop)


async def test_send(subject: CanDriver, can_bus: Bus) -> None:
    """It should send a message."""
    message = CanMessage(
        arbitration_id=ArbitrationId(id=0x1FFFFFFF), data=bytearray([1, 2, 3, 4])
    )
    await subject.send(message)

    recv = can_bus.recv()
    assert recv.data == bytearray([1, 2, 3, 4])
    assert recv.arbitration_id == 0x1FFFFFFF


async def test_receive(subject: CanDriver, can_bus: Bus) -> None:
    """It should receive a message."""
    m = Message(
        arbitration_id=0x1FFFFFFF,
        is_extended_id=True,
        is_fd=True,
        data=bytearray([1, 2, 3, 4]),
    )
    can_bus.send(m)
    recv = await subject.read()

    assert recv.data == bytearray([1, 2, 3, 4])
    assert recv.arbitration_id.id == 0x1FFFFFFF


async def test_receive_iter(subject: CanDriver, can_bus: Bus) -> None:
    """It should receive messages using iterator."""
    m = [
        Message(
            arbitration_id=0x1FFFFFFF,
            is_extended_id=True,
            is_fd=True,
            data=bytearray([1, 2, 3, 4]),
        ),
        Message(
            arbitration_id=0,
            is_extended_id=True,
            is_fd=True,
            data=bytearray([4, 3, 2, 1]),
        ),
    ]

    for message in m:
        can_bus.send(message)

    received = []
    async for recv in subject:
        received.append(recv)
        if len(received) == len(m):
            break

    assert received[0].data == bytearray([1, 2, 3, 4])
    assert received[0].arbitration_id.id == 0x1FFFFFFF
    assert received[1].data == bytearray([4, 3, 2, 1])
    assert received[1].arbitration_id.id == 0
