"""Tests for HeaterShakerModuleContext."""

import pytest

from opentrons.protocol_api_experimental import HeaterShakerModuleContext
from opentrons.protocol_api_experimental.errors import (
    InvalidTargetTemperatureError,
    InvalidTargetSpeedError,
)


@pytest.fixture
def subject() -> HeaterShakerModuleContext:
    """Get a HeaterShakerModuleContext test subject."""
    return HeaterShakerModuleContext(module_id="heater-shaker-id")


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_start_set_temperature(subject: HeaterShakerModuleContext) -> None:
    """It should set the temperature and return immediately."""
    subject.start_set_temperature(40.8)


def test_start_set_invalid_temperature(subject: HeaterShakerModuleContext) -> None:
    """It should raise if target temperature is invalid."""
    with pytest.raises(InvalidTargetTemperatureError):
        subject.start_set_temperature(20)
    with pytest.raises(InvalidTargetTemperatureError):
        subject.start_set_temperature(1000)


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_await_temperature(subject: HeaterShakerModuleContext) -> None:
    """It should await the target temperature."""
    subject.start_set_temperature(40)
    subject.await_temperature()


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_stop_heating(subject: HeaterShakerModuleContext) -> None:
    """It should stop heater shaker heating."""
    subject.stop_heating()


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_set_speed(subject: HeaterShakerModuleContext) -> None:
    """It should set heater shaker speed."""
    subject.set_shake_speed(500)


def test_set_invalid_speed(subject: HeaterShakerModuleContext) -> None:
    """It should raise error when given invalid speed."""
    with pytest.raises(InvalidTargetSpeedError):
        subject.set_shake_speed(10)
    with pytest.raises(InvalidTargetSpeedError):
        subject.set_shake_speed(10000)


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_stop_shake(subject: HeaterShakerModuleContext) -> None:
    """It should stop shake."""
    subject.stop_shake()
