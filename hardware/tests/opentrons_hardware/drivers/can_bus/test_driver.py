"""Can Driver tests."""
from typing import AsyncGenerator

import pytest
from can import Bus, Message

from opentrons_shared_data.errors.exceptions import CANBusBusError
from opentrons_hardware.drivers.can_bus import CanDriver, ArbitrationId, CanMessage


@pytest.fixture
def bus_channel() -> str:
    """The virtual can bus channel."""
    return "test_channel"


@pytest.mark.slow
@pytest.fixture
def can_bus(bus_channel: str) -> Bus:
    """A virtual can bus fixture."""
    bus = Bus(bus_channel, interface="virtual")
    yield bus
    bus.shutdown()


@pytest.fixture
async def subject(bus_channel: str) -> AsyncGenerator[CanDriver, None]:
    """The can driver under test."""
    driver = await CanDriver.build(channel=bus_channel, interface="virtual", bitrate=0)
    yield driver
    driver.shutdown()


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


async def test_raise_error_frame_error(subject: CanDriver, can_bus: Bus) -> None:
    """It should raise an error when an error frame is received."""
    m = Message(
        arbitration_id=0x1FFFFFFF,
        is_extended_id=True,
        is_error_frame=True,
        is_fd=True,
        data=bytearray([1, 2, 3, 4]),
    )
    can_bus.send(m)
    with pytest.raises(CANBusBusError):
        await subject.read()
