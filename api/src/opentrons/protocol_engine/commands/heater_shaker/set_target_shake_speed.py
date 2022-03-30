"""Command models to shake the Heater-Shaker Module."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler

SetTargetShakeSpeedCommandType = Literal["heaterShakerModule/setTargetShakeSpeed"]


class SetTargetShakeSpeedParams(BaseModel):
    """Input parameters to start shaking a Heater-Shaker Module."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")
    # TODO(mc, 2022-02-24): for set temperature we use `temperature` (not `celsius`)
    # but for shake we use `rpm` (not `speed`). This is inconsistent
    rpm: float = Field(..., description="Target speed in rotations per minute.")


class SetTargetShakeSpeedResult(BaseModel):
    """Result data from setting a Heater-Shaker's shake speed."""


class SetTargetShakeSpeedImpl(
    AbstractCommandImpl[SetTargetShakeSpeedParams, SetTargetShakeSpeedResult]
):
    """Execution implementation of a Heater-Shaker's shake command."""

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
        params: SetTargetShakeSpeedParams,
    ) -> SetTargetShakeSpeedResult:
        """Set a Heater-Shaker's target shake speed."""
        # Allow propagation of ModuleNotLoadedError and WrongModuleTypeError.
        hs_module_substate = self._state_view.modules.get_heater_shaker_module_substate(
            module_id=params.moduleId
        )

        # Verify speed from hs module view
        validated_speed = hs_module_substate.validate_target_speed(params.rpm)

        # Allow propagation of ModuleNotAttachedError.
        hs_hardware_module = self._equipment.get_module_hardware_api(
            hs_module_substate.module_id
        )

        if hs_hardware_module is not None:
            await hs_hardware_module.set_speed(rpm=validated_speed)

        return SetTargetShakeSpeedResult()


class SetTargetShakeSpeed(
    BaseCommand[SetTargetShakeSpeedParams, SetTargetShakeSpeedResult]
):
    """A command to set a Heater-Shaker's shake speed."""

    commandType: SetTargetShakeSpeedCommandType = (
        "heaterShakerModule/setTargetShakeSpeed"
    )
    params: SetTargetShakeSpeedParams
    result: Optional[SetTargetShakeSpeedResult]

    _ImplementationCls: Type[SetTargetShakeSpeedImpl] = SetTargetShakeSpeedImpl


class SetTargetShakeSpeedCreate(BaseCommandCreate[SetTargetShakeSpeedParams]):
    """A request to create a Heater-Shaker's set shake speed command."""

    commandType: SetTargetShakeSpeedCommandType
    params: SetTargetShakeSpeedParams

    _CommandCls: Type[SetTargetShakeSpeed] = SetTargetShakeSpeed
