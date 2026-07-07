import asyncio
from typing import AsyncGenerator

from decoy import Decoy, matchers
import pytest

from opentrons.hardware_control.modules.types import (
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
)
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control import modules, ExecutionManager
from opentrons.hardware_control.modules.tempdeck import TempDeck, TempDeckReader
from opentrons.drivers.temp_deck import DEFAULT_COMMAND_RETRIES


@pytest.fixture
def usb_port() -> USBPort:
    """Token USB port."""
    return USBPort(
        name="",
        port_number=0,
        device_path="/dev/ot_module_sim_tempdeck0",
    )


@pytest.fixture
async def subject(
    usb_port: USBPort,
    mock_execution_manager: ExecutionManager,
    module_error_callback: ModuleErrorCallback,
    module_disconnected_callback: ModuleDisconnectedCallback,
) -> AsyncGenerator[modules.AbstractModule, None]:
    """Test subject"""
    temp = await modules.build(
        port="/dev/ot_module_sim_tempdeck0",
        usb_port=usb_port,
        type=modules.ModuleType["TEMPERATURE"],
        simulating=True,
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=mock_execution_manager,
        error_callback=module_error_callback,
        disconnected_callback=module_disconnected_callback,
    )
    try:
        yield temp
    finally:
        await temp.cleanup()


async def test_sim_initialization(subject: modules.AbstractModule) -> None:
    """It should build a tempdeck."""
    assert isinstance(subject, modules.AbstractModule)


async def test_sim_state(subject: modules.AbstractModule) -> None:
    """It sohuld forward state."""
    assert isinstance(subject, TempDeck)
    assert subject.temperature == 0
    assert subject.target is None
    assert subject.status == "idle"
    assert subject.live_data["status"] == subject.status

    live_data = subject.live_data["data"]
    assert modules.ModuleDataValidator.is_temperature_module_data(live_data)
    assert live_data["currentTemp"] == subject.temperature
    assert live_data["targetTemp"] == subject.target
    status = subject.device_info
    assert status["serial"] == "dummySerialTD"
    # return v1 if sim_model is not passed
    assert status["model"] == "temp_deck_v1.1"
    assert status["version"] == "dummyVersionTD"


async def test_sim_update(subject: modules.AbstractModule) -> None:
    """It should update state."""
    assert isinstance(subject, TempDeck)
    await subject.start_set_temperature(10)
    await subject.await_temperature(None)
    assert subject.temperature == 10
    assert subject.target == 10
    assert subject.status == "holding at target"
    await subject.deactivate()
    assert subject.temperature == 23
    assert subject.target is None
    assert subject.status == "idle"


async def test_revision_model_parsing(subject: modules.AbstractModule) -> None:
    """It should parse its model."""
    assert isinstance(subject, TempDeck)
    subject._device_info["model"] = "temp_deck_v20"
    assert subject.model() == "temperatureModuleV2"
    subject._device_info["model"] = "temp_deck_v4.0"
    assert subject.model() == "temperatureModuleV1"
    del subject._device_info["model"]
    assert subject.model() == "temperatureModuleV1"
    subject._device_info["model"] = "temp_deck_v1.1"
    assert subject.model() == "temperatureModuleV1"


async def test_error_callback(
    subject: modules.TempDeck,
    monkeypatch: pytest.MonkeyPatch,
    decoy: Decoy,
    module_error_callback: ModuleErrorCallback,
) -> None:
    """It should forward temperature check errors."""
    mock_get_temp = decoy.mock(func=subject._driver.get_temperature)
    exc = Exception("oh no!")
    decoy.when(await mock_get_temp()).then_raise(exc)
    monkeypatch.setattr(subject._driver, "get_temperature", mock_get_temp)
    # TODO(sf,rh): this is EXEC-2757. wait_next_poll() doesn't handle disconnects
    # well and will raise before any HC-module-level error handling happens, aka
    # reconnect logic (driver-level error handling is fine, though)
    with pytest.raises(Exception, match="oh no!"):
        await subject._poller.wait_next_poll()
    decoy.verify(
        module_error_callback(
            matchers.Anything(),
            "temperatureModuleV1",
            "/dev/ot_module_sim_tempdeck0",
            "dummySerialTD",
        ),
        times=0,
    )
    with pytest.raises(Exception, match="oh no!"):
        await subject._poller.wait_next_poll()
    decoy.verify(
        module_error_callback(
            matchers.Anything(),
            "temperatureModuleV1",
            "/dev/ot_module_sim_tempdeck0",
            "dummySerialTD",
        ),
        times=0,
    )
    with pytest.raises(Exception, match="oh no!"):
        await subject._poller.wait_next_poll()
    decoy.verify(
        module_error_callback(
            exc, "temperatureModuleV1", "/dev/ot_module_sim_tempdeck0", "dummySerialTD"
        )
    )


def test_tempdeck_reader_on_error_fires_callback_after_retries_exhausted(
    decoy: Decoy,
) -> None:
    """TempDeckReader.on_error should invoke the error callback exactly once
    after DEFAULT_COMMAND_RETRIES consecutive errors."""
    driver = decoy.mock(name="driver")
    reader = TempDeckReader(driver=driver)
    cb = decoy.mock(name="error_callback")
    reader.set_error_callback(cb)

    exc = Exception("boom")
    for _ in range(DEFAULT_COMMAND_RETRIES):
        reader.on_error(exc)

    decoy.verify(cb(exc), times=1)


def test_tempdeck_reader_on_error_recovers_after_firing(decoy: Decoy) -> None:
    """After the callback fires and resets the debounce counter, a fresh burst
    of errors should fire the callback again rather than running the counter
    negative and never recovering.
    """
    driver = decoy.mock(name="driver")
    reader = TempDeckReader(driver=driver)
    cb = decoy.mock(name="error_callback")
    reader.set_error_callback(cb)

    exc = Exception("boom")
    for _ in range(DEFAULT_COMMAND_RETRIES):
        reader.on_error(exc)
    for _ in range(DEFAULT_COMMAND_RETRIES):
        reader.on_error(exc)

    decoy.verify(cb(exc), times=2)


def test_tempdeck_reader_on_error_resets_on_successful_read(decoy: Decoy) -> None:
    """A successful read resets the debounce counter, so the next error burst
    must again exhaust all retries before firing."""
    driver = decoy.mock(name="driver")
    reader = TempDeckReader(driver=driver)
    cb = decoy.mock(name="error_callback")
    reader.set_error_callback(cb)

    exc = Exception("boom")
    # One error short of firing.
    for _ in range(DEFAULT_COMMAND_RETRIES - 1):
        reader.on_error(exc)
    decoy.verify(cb(matchers.Anything()), times=0)

    reader._debounce_count = DEFAULT_COMMAND_RETRIES

    for _ in range(DEFAULT_COMMAND_RETRIES - 1):
        reader.on_error(exc)
    decoy.verify(cb(matchers.Anything()), times=0)
