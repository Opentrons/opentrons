"""Magnetic Module engage command request, result, and implementation models."""


from __future__ import annotations

from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import MagDeck

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView


EngageCommandType = Literal["magneticModule/engageMagnet"]


class EngageParams(BaseModel):
    """Input data to engage a Magnetic Module."""

    moduleId: str = Field(
        ...,
        description=(
            "The ID of the Magnetic Module whose magnets you want to raise,"
            " from a prior `loadModule` command."
        ),
    )

    # todo(mm, 2022-02-17): Using true millimeters differs from the current JSON
    # protocol schema v6 draft. Ideally, change the v6 draft to match this.
    engageHeight: float = Field(
        ...,
        description=(
            "How high, in millimeters, to raise the magnets."
            "\n\n"
            "Zero is level with the bottom of the labware."
            " This will be a few millimeters above the magnets' hardware home position."
            "\n\n"
            "Units are always true millimeters."
            " This is unlike certain labware definitions,"
            " engage commands in the Python Protocol API,"
            " and engage commands in older versions of the JSON protocol schema."
            " Take care to convert properly."
        ),
    )


class EngageResult(BaseModel):
    """The result of a Magnetic Module engage command."""

    pass


class EngageImplementation(AbstractCommandImpl[EngageParams, EngageResult]):
    """The implementation of a Magnetic Module engage command."""

    def __init__(
        self,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(self, params: EngageParams) -> EngageResult:
        """Execute a Magnetic Module engage command."""
        await self._engage_magnets(
            magnetic_module_id=params.moduleId,
            mm_from_base=params.engageHeight,
        )
        return EngageResult()

    async def _engage_magnets(
        self,
        magnetic_module_id: str,
        mm_from_base: float,
    ) -> None:
        """Engage a loaded Magnetic Module's magnets.

        Raises:
            ModuleDoesNotExistError: If the given module ID doesn't point to a
                module that's already been loaded.
            WrongModuleTypeError: If the given module ID points to a non-Magnetic
                module.
            ModuleNotAttachedError: If the given module ID points to a valid loaded
                Magnetic Module, but that module's hardware wasn't found attached.
            EngageHeightOutOfRangeError: If the given height is unreachable.
        """
        # Allow propagation of ModuleDoesNotExistError.
        model = self._state_view.modules.get_model(module_id=magnetic_module_id)

        # Allow propagation of WrongModuleTypeError and EngageHeightOutOfRangeError.
        hardware_height = self._state_view.modules.calculate_magnet_hardware_height(
            magnetic_module_model=model,
            mm_from_base=mm_from_base,
        )

        if not self._state_view.get_configs().use_virtual_modules:
            # Allow propagation of ModuleNotAttachedError.
            hardware_module = self._state_view.modules.find_loaded_hardware_module(
                module_id=magnetic_module_id,
                attached_modules=self._hardware_api.attached_modules,
                expected_type=MagDeck,
            )
            await hardware_module.engage(height=hardware_height)


class Engage(BaseCommand[EngageParams, EngageResult]):
    """A command to engage a Magnetic Module's magnets."""

    commandType: EngageCommandType = "magneticModule/engageMagnet"
    params: EngageParams
    result: Optional[EngageResult]

    _ImplementationCls: Type[EngageImplementation] = EngageImplementation


class EngageCreate(BaseCommandCreate[EngageParams]):
    """A request to create a Magnetic Module engage command."""

    commandType: EngageCommandType = "magneticModule/engageMagnet"
    params: EngageParams

    _CommandCls: Type[Engage] = Engage
