from unittest.mock import MagicMock

import pytest

from opentrons.commands import types
from opentrons.protocol_api import InstrumentContext
from opentrons.protocols.duration.estimator import (
    DurationEstimator,
    TEMP_MOD_HIGH_THRESH,
    TEMP_MOD_RATE_HIGH_AND_ABOVE,
    TEMP_MOD_LOW_THRESH,
    TEMP_MOD_RATE_LOW_TO_HIGH,
    TEMP_MOD_RATE_ZERO_TO_LOW,
    THERMO_HIGH_THRESH,
    THERMO_LOW_THRESH,
)


@pytest.fixture
def subject() -> DurationEstimator:
    """The test subject."""
    return DurationEstimator()


@pytest.fixture
def mock_instrument() -> MagicMock:
    """A mock instrument context."""
    return MagicMock(spec=InstrumentContext)


def test_ignore_before(subject: DurationEstimator):
    """It should ignore before commands."""
    message = types.DelayMessage(
        payload=types.DelayCommandPayload(minutes=1, seconds=1)
    )
    message["$"] = "before"
    message["name"] = "command.DELAY"
    subject.on_message(message)
    assert subject.get_total_duration() == 0


def test_pick_up_tip(subject: DurationEstimator, mock_instrument: MagicMock):
    """It should time a pick up tip."""
    mock_instrument.default_speed = 1
    # Movement in same slot
    subject._last_deckslot = "1"
    message = types.PickUpTipCommand(
        payload=types.PickUpTipCommandPayload(location="1", instrument=mock_instrument))
    message["$"] = "after"
    message["name"] = types.PICK_UP_TIP
    subject.on_message(message)
    assert subject.get_total_duration() == 4.5


def test_drop_tip(subject: DurationEstimator, mock_instrument: MagicMock):
    """It should time a drop tip."""
    mock_instrument.default_speed = 1
    # Movement in same slot
    subject._last_deckslot = "1"
    message = types.DropTipCommand(
        payload=types.DropTipCommandPayload(location="1", instrument=mock_instrument))
    message["$"] = "after"
    message["name"] = types.DROP_TIP
    subject.on_message(message)
    assert subject.get_total_duration() == 10.5


def test_blow_out(subject: DurationEstimator):
    """It should time a blowout."""
    message = types.BlowOutMessage(payload=types.BlowOutCommandPayload(location=None))
    message["$"] = "after"
    message["name"] = types.BLOW_OUT
    subject.on_message(message)
    assert subject.get_total_duration() == 0.5


def test_touch_tip(subject: DurationEstimator):
    """It should time a touch tip."""
    message = types.TouchTipMessage(payload=types.TouchTipCommandPayload())
    message["$"] = "after"
    message["name"] = types.TOUCH_TIP
    subject.on_message(message)
    assert subject.get_total_duration() == 0.5


def test_delay(subject: DurationEstimator):
    """It should time a delay."""
    message = types.DelayMessage(
        payload=types.DelayCommandPayload(minutes=1, seconds=1)
    )
    message["$"] = "after"
    message["name"] = types.DELAY
    subject.on_message(message)
    assert subject.get_total_duration() == 61


@pytest.mark.parametrize(
    argnames=["current", "target", "expected_duration"],
    argvalues=[
        # No change in temperature
        [1, 1, 0],
        # To a high temperature from a high temperature
        [
            TEMP_MOD_HIGH_THRESH,
            TEMP_MOD_HIGH_THRESH + 1,
            1 / TEMP_MOD_RATE_HIGH_AND_ABOVE,
        ],
        # To a medium temperature from a medium temperature
        [
            TEMP_MOD_LOW_THRESH + 1,
            TEMP_MOD_HIGH_THRESH - 1,
            ((TEMP_MOD_HIGH_THRESH - 1) - (TEMP_MOD_LOW_THRESH + 1))
            / TEMP_MOD_RATE_LOW_TO_HIGH,
        ],
        # To a low temperature from a low temperature
        [
            TEMP_MOD_LOW_THRESH - 1,
            TEMP_MOD_LOW_THRESH - 2,
            1 / TEMP_MOD_RATE_ZERO_TO_LOW,
        ],
    ],
)
def test_temperature_module(
    subject: DurationEstimator, current: float, target: float, expected_duration: float
):
    """It should compute the duration of a temperature change correctly."""
    assert subject.temperature_module(current, target) == expected_duration


def test_thermocycler_set_lid_temp(subject: DurationEstimator):
    """It should compute the duration of a set lid temp."""
    message = types.ThermocyclerSetLidTempCommand(
        payload=types.ThermocyclerSetLidTempCommandPayload()
    )
    message["$"] = "after"
    message["name"] = types.THERMOCYCLER_SET_LID_TEMP
    subject.on_message(message)
    assert subject.get_total_duration() == 60


def test_thermocycler_lid_close(subject: DurationEstimator):
    """It should compute the duration of a lid close."""
    message = types.ThermocyclerCloseMessage(
        payload=types.ThermocyclerCloseCommandPayload()
    )
    message["$"] = "after"
    message["name"] = types.THERMOCYCLER_CLOSE
    subject.on_message(message)
    assert subject.get_total_duration() == 24


def test_thermocycler_lid_open(subject: DurationEstimator):
    """It should compute the duration of a lid open."""
    message = types.ThermocyclerCloseMessage(
        payload=types.ThermocyclerCloseCommandPayload()
    )
    message["$"] = "after"
    message["name"] = types.THERMOCYCLER_CLOSE
    subject.on_message(message)
    assert subject.get_total_duration() == 24


def test_thermocycler_deactivate_lid(subject: DurationEstimator):
    """It should compute the duration of a lid open."""
    message = types.ThermocyclerDeactivateMessage(
        payload=types.ThermocyclerDeactivateLidCommandPayload()
    )
    message["$"] = "after"
    message["name"] = types.THERMOCYCLER_DEACTIVATE_LID
    subject.on_message(message)
    assert subject.get_total_duration() == 23


@pytest.mark.parametrize(
    argnames=["current", "target", "expected_duration"],
    argvalues=[
        # No change in temperature
        [1, 1, 0],
        # Heating above high threshold
        [10, THERMO_HIGH_THRESH + 5, (5 / 2) + ((THERMO_HIGH_THRESH - 10) / 4)],
        # Heating below high threshold
        [THERMO_HIGH_THRESH - 10, THERMO_HIGH_THRESH - 5, (5 / 4)],
        # Cooling above high threshold
        [THERMO_HIGH_THRESH + 20, THERMO_HIGH_THRESH + 10, (10 / 2)],
        # Cooling above low threshold
        [THERMO_LOW_THRESH + 20, THERMO_LOW_THRESH + 10, 10],
        # Cooling below low threshold
        [THERMO_LOW_THRESH - 10, THERMO_LOW_THRESH - 20, (10 / 0.5) + (20 / 0.1)],
    ],
)
def test_thermocycler_handler(
    subject: DurationEstimator, current: float, target: float, expected_duration: float
):
    """It should compute the duration of a temperature change correctly."""
    assert subject.thermocyler_handler(current, target) == expected_duration
