"""Magnetic Module disengage command request, result, and implementation models."""


from __future__ import annotations

from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import MagDeck

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView


DisengageCommandType = Literal["magneticModule/disengageMagnet"]


class DisengageParams(BaseModel):
    """Input data to disengage a Magnetic Module's magnets."""

    moduleId: str = Field(
        ...,
        description=(
            "The ID of the Magnetic Module whose magnets you want to disengage,"
            " from a prior `loadModule` command."
        ),
    )


class DisengageResult(BaseModel):
    """The result of a Magnetic Module disengage command."""

    pass


class DisengageImplementation(AbstractCommandImpl[DisengageParams, DisengageResult]):
    """The implementation of a Magnetic Module disengage command."""

    def __init__(
        self,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(self, params: DisengageParams) -> DisengageResult:
        """Execute a Magnetic Module disengage command.

        Raises:
            ModuleNotLoadedError: If the given module ID has not been loaded.
            WrongModuleTypeError: If the given module ID has been loaded,
                but it's not a Magnetic Module.
            ModuleNotAttachedError: If the given module ID points to a valid loaded
                Magnetic Module, but that module's hardware wasn't found attached.
        """
        # Allow propagation of ModuleNotLoadedError and WrongModuleTypeError.
        # Do this check even when using virtual modules,
        # to fully validate module IDs during analysis.
        self._state_view.modules.assert_is_magnetic_module(module_id=params.moduleId)

        if not self._state_view.get_configs().use_virtual_modules:
            all_attached_modules = self._hardware_api.attached_modules
            # Allow propagation of ModuleNotAttachedError.
            target_module = self._state_view.modules.find_loaded_hardware_module(
                module_id=params.moduleId,
                attached_modules=all_attached_modules,
                expected_type=MagDeck,
            )
            await target_module.deactivate()

        return DisengageResult()


class Disengage(BaseCommand[DisengageParams, DisengageResult]):
    """A command to disengage a Magnetic Module's magnets."""

    commandType: DisengageCommandType = "magneticModule/disengageMagnet"
    params: DisengageParams
    result: Optional[DisengageResult]

    _ImplementationCls: Type[DisengageImplementation] = DisengageImplementation


class DisengageCreate(BaseCommandCreate[DisengageParams]):
    """A request to create a Magnetic Module disengage command."""

    commandType: DisengageCommandType = "magneticModule/disengageMagnet"
    params: DisengageParams

    _CommandCls: Type[Disengage] = Disengage
