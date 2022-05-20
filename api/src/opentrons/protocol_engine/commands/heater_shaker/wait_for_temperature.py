"""Command models to wait for a Heater-Shaker Module's target temperature."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler


WaitForTemperatureCommandType = Literal["heaterShaker/waitForTemperature"]


class WaitForTemperatureParams(BaseModel):
    """Input parameters to wait for a Heater-Shaker's target temperature."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")


class WaitForTemperatureResult(BaseModel):
    """Result data from waiting for a Heater-Shaker's target temperature."""


class WaitForTemperatureImpl(
    AbstractCommandImpl[WaitForTemperatureParams, WaitForTemperatureResult]
):
    """Execution implementation of a Heater-Shaker's wait for temperature command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(
        self, params: WaitForTemperatureParams
    ) -> WaitForTemperatureResult:
        """Wait for a Heater-Shaker's target temperature to be reached."""
        hs_module_substate = self._state_view.modules.get_heater_shaker_module_substate(
            module_id=params.moduleId
        )

        # Raises error if no target temperature
        target_temp = hs_module_substate.get_plate_target_temperature()
        hs_hardware_module = self._equipment.get_module_hardware_api(
            hs_module_substate.module_id
        )

        if hs_hardware_module is not None:
            await hs_hardware_module.await_temperature(awaiting_temperature=target_temp)

        return WaitForTemperatureResult()


class WaitForTemperature(
    BaseCommand[WaitForTemperatureParams, WaitForTemperatureResult]
):
    """A command to wait for a Heater-Shaker's target temperature to be reached."""

    commandType: WaitForTemperatureCommandType = "heaterShaker/waitForTemperature"
    params: WaitForTemperatureParams
    result: Optional[WaitForTemperatureResult]

    _ImplementationCls: Type[WaitForTemperatureImpl] = WaitForTemperatureImpl


class WaitForTemperatureCreate(BaseCommandCreate[WaitForTemperatureParams]):
    """A request to create a Heater-Shaker's wait for temperature command."""

    commandType: WaitForTemperatureCommandType
    params: WaitForTemperatureParams

    _CommandCls: Type[WaitForTemperature] = WaitForTemperature
