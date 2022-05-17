"""Command models to start and wait for heating a Thermocycler's block."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler


SetAndWaitForBlockTemperatureCommandType = Literal[
    "thermocycler/setAndWaitForBlockTemperature"
]


class SetAndWaitForBlockTemperatureParams(BaseModel):
    """Input parameters to set and wait for Thermocycler's target block temperature."""

    moduleId: str = Field(..., description="Unique ID of the Thermocycler Module.")
    celsius: float = Field(..., description="Target temperature in °C.")


class SetAndWaitForBlockTemperatureResult(BaseModel):
    """Result data from set and wait for a Thermocycler's target block temperature."""


class SetAndWaitForBlockTemperatureImpl(
    AbstractCommandImpl[
        SetAndWaitForBlockTemperatureParams,
        SetAndWaitForBlockTemperatureResult,
    ]
):
    """Execution implementation of a TC's set and wait for block temperature command."""

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
        params: SetAndWaitForBlockTemperatureParams,
    ) -> SetAndWaitForBlockTemperatureResult:
        """Set and wait for a Thermocycler's target block temperature."""
        thermocycler_state = self._state_view.modules.get_thermocycler_module_substate(
            params.moduleId
        )
        target_temperature = thermocycler_state.validate_target_block_temperature(
            params.celsius
        )
        thermocycler_hardware = self._equipment.get_module_hardware_api(
            thermocycler_state.module_id
        )

        if thermocycler_hardware is not None:
            await thermocycler_hardware.set_temperature(target_temperature)

        return SetAndWaitForBlockTemperatureResult()


class SetAndWaitForBlockTemperature(
    BaseCommand[
        SetAndWaitForBlockTemperatureParams, SetAndWaitForBlockTemperatureResult
    ]
):
    """A command to set and wait for a Thermocycler's target block temperature."""

    commandType: SetAndWaitForBlockTemperatureCommandType = (
        "thermocycler/setAndWaitForBlockTemperature"
    )
    params: SetAndWaitForBlockTemperatureParams
    result: Optional[SetAndWaitForBlockTemperatureResult]

    _ImplementationCls: Type[
        SetAndWaitForBlockTemperatureImpl
    ] = SetAndWaitForBlockTemperatureImpl


class SetAndWaitForBlockTemperatureCreate(
    BaseCommandCreate[SetAndWaitForBlockTemperatureParams]
):
    """A request to create Thermocycler's set and wait for block temperature command."""

    commandType: SetAndWaitForBlockTemperatureCommandType
    params: SetAndWaitForBlockTemperatureParams

    _CommandCls: Type[SetAndWaitForBlockTemperature] = SetAndWaitForBlockTemperature
