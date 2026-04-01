"""Command models to wait for heating a Thermocycler's block."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import BaseModel, Field
from typing_extensions import Literal, Type

from ...errors.error_occurrence import ErrorOccurrence
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import EquipmentHandler
    from opentrons.protocol_engine.state.state import StateView


WaitForBlockTemperatureCommandType = Literal["thermocycler/waitForBlockTemperature"]


class WaitForBlockTemperatureParams(BaseModel):
    """Input parameters to wait for Thermocycler's target block temperature."""

    moduleId: str = Field(..., description="Unique ID of the Thermocycler Module.")


class WaitForBlockTemperatureResult(BaseModel):
    """Result data from wait for Thermocycler's target block temperature."""


class WaitForBlockTemperatureImpl(
    AbstractCommandImpl[
        WaitForBlockTemperatureParams, SuccessData[WaitForBlockTemperatureResult]
    ]
):
    """Execution implementation of Thermocycler's wait for block temperature command."""

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
        params: WaitForBlockTemperatureParams,
    ) -> SuccessData[WaitForBlockTemperatureResult]:
        """Wait for a Thermocycler's target block temperature."""
        thermocycler_state = self._state_view.modules.get_thermocycler_module_substate(
            params.moduleId
        )

        # Raises error if no target temperature
        thermocycler_state.get_target_block_temperature()

        thermocycler_hardware = self._equipment.get_module_hardware_api(
            thermocycler_state.module_id
        )

        if thermocycler_hardware is not None:
            await thermocycler_hardware.wait_for_block_target()

        return SuccessData(
            public=WaitForBlockTemperatureResult(),
        )


class WaitForBlockTemperature(
    BaseCommand[
        WaitForBlockTemperatureParams, WaitForBlockTemperatureResult, ErrorOccurrence
    ]
):
    """A command to wait for a Thermocycler's target block temperature."""

    commandType: WaitForBlockTemperatureCommandType = (
        "thermocycler/waitForBlockTemperature"
    )
    params: WaitForBlockTemperatureParams
    result: Optional[WaitForBlockTemperatureResult] = None

    _ImplementationCls: Type[WaitForBlockTemperatureImpl] = WaitForBlockTemperatureImpl


class WaitForBlockTemperatureCreate(BaseCommandCreate[WaitForBlockTemperatureParams]):
    """A request to create Thermocycler's wait for block temperature command."""

    commandType: WaitForBlockTemperatureCommandType = (
        "thermocycler/waitForBlockTemperature"
    )
    params: WaitForBlockTemperatureParams

    _CommandCls: Type[WaitForBlockTemperature] = WaitForBlockTemperature
