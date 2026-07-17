"""Tests for the vacuum module simulating driver."""

import pytest

from opentrons.drivers.vacuum_module.errors import (
    PressureNotReached,
    WasteContainerFull,
)
from opentrons.drivers.vacuum_module.simulator import SimulatingDriver


@pytest.fixture
def subject() -> SimulatingDriver:
    """Get a vacuum module simulating driver."""
    return SimulatingDriver(serial_number="VM123")


async def test_inject_async_error_raises_on_vacuum_state_read(
    subject: SimulatingDriver,
) -> None:
    """It should raise a queued async error on the next vacuum state read."""
    subject.inject_async_error(
        WasteContainerFull("port", "async ERR401:waste full", "M121")
    )

    with pytest.raises(WasteContainerFull):
        await subject.get_vacuum_state()

    assert await subject.get_vacuum_state() is not None


async def test_inject_async_error_raises_on_pump_state_read(
    subject: SimulatingDriver,
) -> None:
    """It should raise a queued async error on the next pump state read."""
    subject.inject_async_error(
        PressureNotReached("port", "async ERR400:pressure not reached", "M123")
    )

    with pytest.raises(PressureNotReached):
        await subject.get_pump_state()

    assert await subject.get_pump_state() is not None
