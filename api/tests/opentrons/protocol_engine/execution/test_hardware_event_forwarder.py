"""Tests for hardware_event_forwarder."""


import pytest
from decoy import Decoy


from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.actions import ActionDispatcher
from opentrons.protocol_engine.execution.hardware_event_forwarder import (
    HardwareEventForwarder,
)


@pytest.fixture
def unsubscribe_callback():
    raise NotImplementedError


@pytest.fixture
def hardware_control_api() -> HardwareControlAPI:
    raise NotImplementedError


def test_hardware_event_forwarder(decoy: Decoy) -> None:
    raise NotImplementedError


def test_multiple_unsubscribes() -> None:
    raise NotImplementedError
