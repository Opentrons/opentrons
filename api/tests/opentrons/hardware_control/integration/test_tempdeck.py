from typing import AsyncGenerator

import pytest
from opentrons.hardware_control import ExecutionManager
from opentrons.hardware_control.emulation.settings import Settings
from opentrons.hardware_control.modules import TempDeck

from .build_module import build_module


@pytest.fixture
async def tempdeck(
    emulator_settings: Settings,
    emulation_app: None,
    execution_manager: ExecutionManager,
    poll_interval_seconds: float,
) -> AsyncGenerator[TempDeck, None]:
    module = await build_module(
        TempDeck,
        port=emulator_settings.temperature_proxy.driver_port,
        execution_manager=execution_manager,
        poll_interval_seconds=poll_interval_seconds,
    )
    yield module
    await module.cleanup()


def test_device_info(tempdeck: TempDeck) -> None:
    """It should have the device info."""
    assert {
        "model": "temp_deck_v20",
        "serial": "temperature_emulator",
        "version": "v2.0.1",
    } == tempdeck.device_info


async def test_set_temperature(tempdeck: TempDeck) -> None:
    """It should set the temperature and return when target is reached."""
    assert tempdeck.live_data == {
        "status": "idle",
        "data": {"currentTemp": 0, "targetTemp": None},
    }

    await tempdeck.start_set_temperature(10)
    await tempdeck.await_temperature(None)

    assert tempdeck.live_data == {
        "status": "holding at target",
        "data": {"currentTemp": 10, "targetTemp": 10},
    }


async def test_start_set_temperature_cool(tempdeck: TempDeck) -> None:
    """It should set the temperature and return and wait for temperature."""
    current = tempdeck.temperature
    new_temp = current - 20

    await tempdeck.start_set_temperature(new_temp)
    assert tempdeck.live_data == {
        "status": "cooling",
        "data": {"currentTemp": pytest.approx(current, abs=5), "targetTemp": new_temp},
    }

    # Wait for temperature to be reached
    await tempdeck.await_temperature(awaiting_temperature=new_temp)
    assert tempdeck.live_data == {
        "status": "holding at target",
        "data": {"currentTemp": new_temp, "targetTemp": new_temp},
    }


async def test_start_set_temperature_heat(tempdeck: TempDeck) -> None:
    """It should set the temperature and return and wait for temperature."""
    current = tempdeck.temperature
    new_temp = current + 20

    await tempdeck.start_set_temperature(new_temp)
    assert tempdeck.live_data == {
        "status": "heating",
        "data": {"currentTemp": pytest.approx(current, abs=5), "targetTemp": new_temp},
    }

    # Wait for temperature to be reached
    await tempdeck.await_temperature(awaiting_temperature=new_temp)
    assert tempdeck.live_data == {
        "status": "holding at target",
        "data": {"currentTemp": new_temp, "targetTemp": new_temp},
    }


async def test_deactivate(tempdeck: TempDeck) -> None:
    """It should deactivate and move to room temperature"""
    await tempdeck.deactivate()
    await tempdeck.await_temperature(awaiting_temperature=23)

    assert tempdeck.live_data == {
        "status": "idle",
        "data": {"currentTemp": 23, "targetTemp": None},
    }


async def test_forcible_deactivate(
    tempdeck: TempDeck, execution_manager: ExecutionManager
) -> None:
    """Can override wait_for_is_running."""
    await execution_manager.pause()
    await tempdeck.deactivate(must_be_running=False)
