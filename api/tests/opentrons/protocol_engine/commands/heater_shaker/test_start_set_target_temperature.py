"""Test Heater Shaker start set temperature command implementation."""
import pytest
from decoy import Decoy

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import AbstractModule, HeaterShaker

from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.types import ModuleModel
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.heater_shaker.start_set_target_temperature import (  # noqa: E501
    StartSetTargetTemperatureImpl,
)


@pytest.fixture
def hardware_api(
    decoy: Decoy,
) -> HardwareControlAPI:
    """Return a mock in the shape of a HardwareControlAPI."""
    hw = decoy.mock(cls=HardwareControlAPI)
    hw.attached_modules = [decoy.mock(cls=AbstractModule),  # type: ignore[misc]
                           decoy.mock(cls=AbstractModule)]
    return hw


@pytest.fixture
def state_view(decoy: Decoy) -> StateView:
    """Get a mocked out StateView."""
    return decoy.mock(cls=StateView)


@pytest.fixture
def subject(
        hardware_api: HardwareControlAPI,
        state_view: StateView,
) -> StartSetTargetTemperatureImpl:
    """Get the command implementation with mocked out dependencies."""
    return StartSetTargetTemperatureImpl(
        state_view=state_view,
        hardware_api=hardware_api
    )


async def test_start_set_target_temperature(
    decoy: Decoy,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
    subject: StartSetTargetTemperatureImpl,
) -> None:
    """It should be able to set the specified module's target temperature."""
    data = heater_shaker.StartSetTargetTemperatureParams(
        moduleId="heater-shaker-id",
        temperature=42,
    )

    decoy.when(
        state_view.modules.get_model(module_id="heater-shaker-id")
    ).then_return(ModuleModel.HEATER_SHAKER_MODULE_V1)

    decoy.when(
        state_view.modules.is_target_temperature_valid(
            heating_module_model=ModuleModel.HEATER_SHAKER_MODULE_V1,
            celsius=42
        )
    ).then_return(True)

    mocked_hw_module = decoy.mock(cls=HeaterShaker)

    decoy.when(
        state_view.modules.find_loaded_hardware_module(
            module_id="heater-shaker-id",
            attached_modules=hardware_api.attached_modules,
            expected_type=HeaterShaker,
        )
    ).then_return(mocked_hw_module)

    result = await subject.execute(data)
    decoy.verify(await mocked_hw_module.start_set_temperature(celsius=42), times=1)
    assert result == heater_shaker.StartSetTargetTemperatureResult()
