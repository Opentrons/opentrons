"""Command models to shake the Heater-Shaker Module."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate
from opentrons.hardware_control import HardwareControlAPI

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView

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
        hardware_api: HardwareControlAPI,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(
        self,
        params: SetTargetShakeSpeedParams,
    ) -> SetTargetShakeSpeedResult:
        """Set a Heater-Shaker's target shake speed."""
        # Allow propagation of ModuleNotLoadedError and WrongModuleTypeError.
        hs_module_view = self._state_view.modules.get_heater_shaker_module_view(
            module_id=params.moduleId
        )

        # Verify speed from hs module view
        assert hs_module_view.is_target_speed_valid(int(params.rpm))

        # Allow propagation of ModuleNotAttachedError.
        hs_hardware_module = hs_module_view.find_hardware(
            attached_modules=self._hardware_api.attached_modules
        )

        if hs_hardware_module is not None:
            await hs_hardware_module.set_speed(rpm=int(params.rpm))
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
