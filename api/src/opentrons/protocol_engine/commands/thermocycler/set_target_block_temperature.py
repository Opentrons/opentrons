"""Command models to start heating a Thermocycler's block."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler


SetTargetBlockTemperatureCommandType = Literal["thermocycler/setTargetBlockTemperature"]


class SetTargetBlockTemperatureParams(BaseModel):
    """Input parameters to set a Thermocycler's target block temperature."""

    moduleId: str = Field(..., description="Unique ID of the Thermocycler Module.")
    # TODO(mc, 2022-04-25): rename to "celsius"
    temperature: float = Field(..., description="Target temperature in °C.")


class SetTargetBlockTemperatureResult(BaseModel):
    """Result data from setting a Thermocycler's target block temperature."""


class SetTargetBlockTemperatureImpl(
    AbstractCommandImpl[
        SetTargetBlockTemperatureParams,
        SetTargetBlockTemperatureResult,
    ]
):
    """Execution implementation of a Thermocycler's set block temperature command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(
        self,
        params: SetTargetBlockTemperatureParams,
    ) -> SetTargetBlockTemperatureResult:
        """Set a Thermocycler's target block temperature."""
        thermocycler_state = self._state_view.modules.get_thermocycler_module_substate(
            params.moduleId
        )
        target_temperature = thermocycler_state.validate_target_block_temperature(
            params.temperature
        )
        thermocycler_hardware = self._equipment.get_module_hardware_api(
            thermocycler_state.module_id
        )

        if thermocycler_hardware is not None:
            await thermocycler_hardware.set_target_block_temperature(target_temperature)

        return SetTargetBlockTemperatureResult()


class SetTargetBlockTemperature(
    BaseCommand[SetTargetBlockTemperatureParams, SetTargetBlockTemperatureResult]
):
    """A command to set a Thermocycler's target block temperature."""

    commandType: SetTargetBlockTemperatureCommandType = (
        "thermocycler/setTargetBlockTemperature"
    )
    params: SetTargetBlockTemperatureParams
    result: Optional[SetTargetBlockTemperatureResult]

    _ImplementationCls: Type[
        SetTargetBlockTemperatureImpl
    ] = SetTargetBlockTemperatureImpl


class SetTargetBlockTemperatureCreate(
    BaseCommandCreate[SetTargetBlockTemperatureParams]
):
    """A request to create a Thermocycler's set block temperature command."""

    commandType: SetTargetBlockTemperatureCommandType
    params: SetTargetBlockTemperatureParams

    _CommandCls: Type[SetTargetBlockTemperature] = SetTargetBlockTemperature
