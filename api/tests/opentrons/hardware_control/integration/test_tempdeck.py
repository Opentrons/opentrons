import asyncio

import pytest
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control import ExecutionManager
from opentrons.hardware_control.emulation.app import TEMPDECK_PORT
from opentrons.hardware_control.modules import TempDeck


@pytest.fixture
async def tempdeck(loop: asyncio.BaseEventLoop, emulation_app) -> TempDeck:
    execution_manager = ExecutionManager(loop)
    module = await TempDeck.build(
        port=f"socket://127.0.0.1:{TEMPDECK_PORT}",
        execution_manager=execution_manager,
        usb_port=USBPort(name="", port_number=1, sub_names=[], device_path="", hub=1),
        loop=loop,
        polling_frequency=0.01,
    )
    yield module
    await execution_manager.cancel()
    await module.cleanup()


def test_device_info(tempdeck) -> None:
    """It should have the device info."""
    assert {
        "model": "temp_deck_v20",
        "serial": "temperature_emulator",
        "version": "v2.0.1",
    } == tempdeck.device_info


async def test_set_temperature(tempdeck) -> None:
    """It should set the temperature and return when target is reached."""
    await tempdeck.wait_next_poll()
    assert tempdeck.live_data == {
        "status": "idle",
        "data": {"currentTemp": 0, "targetTemp": None},
    }

    await tempdeck.set_temperature(10)
    assert tempdeck.live_data == {
        "status": "holding at target",
        "data": {"currentTemp": 10, "targetTemp": 10},
    }


async def test_start_set_temperature_cool(tempdeck) -> None:
    """It should set the temperature and return and wait for temperature."""
    await tempdeck.wait_next_poll()
    current = tempdeck.temperature
    new_temp = current - 20

    await tempdeck.start_set_temperature(new_temp)
    # Wait for poll
    await tempdeck.wait_next_poll()
    assert tempdeck.live_data == {
        "status": "cooling",
        "data": {"currentTemp": current, "targetTemp": new_temp},
    }

    # Wait for temperature to be reached
    await tempdeck.await_temperature(awaiting_temperature=new_temp)
    assert tempdeck.live_data == {
        "status": "holding at target",
        "data": {"currentTemp": new_temp, "targetTemp": new_temp},
    }


async def test_start_set_temperature_heat(tempdeck) -> None:
    """It should set the temperature and return and wait for temperature."""
    await tempdeck.wait_next_poll()
    current = tempdeck.temperature
    new_temp = current + 20

    await tempdeck.start_set_temperature(new_temp)
    # Wait for poll
    await tempdeck.wait_next_poll()
    assert tempdeck.live_data == {
        "status": "heating",
        "data": {"currentTemp": current, "targetTemp": new_temp},
    }

    # Wait for temperature to be reached
    await tempdeck.await_temperature(awaiting_temperature=new_temp)
    assert tempdeck.live_data == {
        "status": "holding at target",
        "data": {"currentTemp": new_temp, "targetTemp": new_temp},
    }


async def test_deactivate(tempdeck) -> None:
    """It should deactivate and move to room temperature"""
    await tempdeck.deactivate()
    await tempdeck.wait_next_poll()
    # Wait for temperature to be reached
    await tempdeck.await_temperature(awaiting_temperature=23)
    assert tempdeck.live_data == {
        "status": "idle",
        "data": {"currentTemp": 23, "targetTemp": None},
    }
