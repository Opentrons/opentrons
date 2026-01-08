import asyncio
from typing import AsyncGenerator

import pytest

from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control import ExecutionManager, modules
from opentrons.hardware_control.modules.magdeck import MagDeck
from opentrons.hardware_control.modules.types import (
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
)


@pytest.fixture
def usb_port() -> USBPort:
    """Token USB port."""
    return USBPort(
        name="",
        port_number=0,
        device_path="/dev/ot_module_sim_magdeck0",
    )


@pytest.fixture
async def subject(
    usb_port: USBPort,
    mock_execution_manager: ExecutionManager,
    module_error_callback: ModuleErrorCallback,
    module_disconnected_callback: ModuleDisconnectedCallback,
) -> AsyncGenerator[modules.AbstractModule, None]:
    """Test subject."""
    mag = await modules.build(
        port="/dev/ot_module_sim_magdeck0",
        usb_port=usb_port,
        type=modules.ModuleType["MAGNETIC"],
        simulating=True,
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=mock_execution_manager,
        error_callback=module_error_callback,
        disconnected_callback=module_disconnected_callback,
    )
    try:
        yield mag
    finally:
        await mag.cleanup()


async def test_sim_initialization(subject: modules.MagDeck) -> None:
    """It should initialize to an AbstractModule."""
    assert isinstance(subject, modules.AbstractModule)


async def test_sim_data(subject: modules.MagDeck) -> None:
    """It should forward simulated data."""
    assert subject.status == "disengaged"
    assert subject.device_info["serial"] == "dummySerialMD"
    # return v1 when sim_model is not passed
    assert subject.device_info["model"] == "mag_deck_v1.1"
    assert subject.device_info["version"] == "dummyVersionMD"
    assert subject.live_data["status"] == subject.status
    assert "data" in subject.live_data


async def test_sim_state_update(subject: modules.MagDeck) -> None:
    """It should update simulated state."""
    assert isinstance(subject, MagDeck)
    await subject.calibrate()
    assert subject.status == "disengaged"
    await subject.engage(2)
    assert subject.status == "engaged"
    await subject.deactivate()
    assert subject.status == "disengaged"


async def test_revision_model_parsing(subject: modules.MagDeck) -> None:
    """It should parse its own revision."""
    assert isinstance(subject, MagDeck)
    subject._device_info["model"] = "mag_deck_v1.1"
    assert subject.model() == "magneticModuleV1"
    subject._device_info["model"] = "mag_deck_v20"
    assert subject.model() == "magneticModuleV2"
    del subject._device_info["model"]
    assert subject.model() == "magneticModuleV1"
