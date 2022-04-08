"""Command models to deactivate a Temperature Module."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler

DeactivateTemperatureCommandType = Literal["temperatureModule/deactivate"]


class DeactivateTemperatureParams(BaseModel):
    """Input parameters to deactivate a Temperature Module."""

    moduleId: str = Field(..., description="Unique ID of the Temperature Module.")


class DeactivateTemperatureResult(BaseModel):
    """Result data from deactivating a Temperature Module."""


class DeactivateTemperatureImpl(
    AbstractCommandImpl[DeactivateTemperatureParams, DeactivateTemperatureResult]
):
    """Execution implementation of a Temperature Module's deactivate command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(
        self, params: DeactivateTemperatureParams
    ) -> DeactivateTemperatureResult:
        """Deactivate a Temperature Module."""
        # Allow propagation of ModuleNotLoadedError and WrongModuleTypeError.
        module_substate = self._state_view.modules.get_temperature_module_substate(
            module_id=params.moduleId
        )

        # Allow propagation of ModuleNotAttachedError.
        temp_hardware_module = self._equipment.get_module_hardware_api(
            module_substate.module_id
        )

        if temp_hardware_module is not None:
            await temp_hardware_module.deactivate()
        return DeactivateTemperatureResult()


class DeactivateTemperature(
    BaseCommand[DeactivateTemperatureParams, DeactivateTemperatureResult]
):
    """A command to deactivate a Temperature Module."""

    commandType: DeactivateTemperatureCommandType = "temperatureModule/deactivate"

    params: DeactivateTemperatureParams
    result: Optional[DeactivateTemperatureResult]

    _ImplementationCls: Type[DeactivateTemperatureImpl] = DeactivateTemperatureImpl


class DeactivateTemperatureCreate(BaseCommandCreate[DeactivateTemperatureParams]):
    """A request to deactivate a Temperature Module."""

    commandType: DeactivateTemperatureCommandType
    params: DeactivateTemperatureParams

    _CommandCls: Type[DeactivateTemperature] = DeactivateTemperature
