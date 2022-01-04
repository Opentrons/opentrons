"""Implementation, request models, and response models for the load module command."""

from typing import Optional, Type
from typing_extensions import Literal
from pydantic import BaseModel, Field

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate
from ..types import DeckSlotLocation, ModuleModel, ModuleDefinition


LoadModuleCommandType = Literal["loadModule"]


class LoadModuleParams(BaseModel):
    """Payload required to load a module."""

    model: ModuleModel = Field(
        ...,
        description=(
            "The exact model name of the module to load."
            "\n\n"
            "In the future,"
            " this command may change so that the load will succeed"
            " if the physically attached module is merely compatible"
            " with the version you requested."
        ),
    )

    # Note: Our assumption here that a module's position can be boiled down to a
    # single deck slot precludes loading a Thermocycler in its special "shifted slightly
    # to the left" position. This is okay for now because neither the Python Protocol
    # API nor Protocol Designer attempt to support it, either.
    location: DeckSlotLocation = Field(
        ...,
        description=(
            "The location into which this module should be loaded."
            "\n\n"
            "For the Thermocycler Module, which occupies multiple deck slots,"
            " this should be the front-most occupied slot (normally slot 7)."
        ),
    )

    moduleId: Optional[str] = Field(
        None,
        description=(
            "An optional ID to assign to this module."
            " If None, an ID will be generated."
        ),
    )


class LoadModuleResult(BaseModel):
    """The results of loading a module."""

    moduleId: str = Field(
        description="An ID to reference this module in subsequent commands."
    )

    # TODO (spp, 2021-11-24): Evaluate if this needs to be in the result
    definition: ModuleDefinition = Field(description="The definition of this module.")

    # TODO (spp, 2021-11-24): Remove optional
    moduleSerial: Optional[str] = Field(
        None, description="Hardware serial number of the module, if connected."
    )


class LoadModuleImplementation(AbstractCommandImpl[LoadModuleParams, LoadModuleResult]):
    """The implementation of the load module command."""

    async def execute(self, params: LoadModuleParams) -> LoadModuleResult:
        """Check that the requested module is attached and assign its identifier."""
        loaded_module = await self._equipment.load_module(
            model=params.model,
            location=params.location,
            module_id=params.moduleId,
        )
        return LoadModuleResult(
            moduleId=loaded_module.module_id,
            moduleSerial=loaded_module.module_serial,
            definition=loaded_module.definition,
        )


class LoadModule(BaseCommand[LoadModuleParams, LoadModuleResult]):
    """The model for a load module command."""

    commandType: LoadModuleCommandType = "loadModule"
    params: LoadModuleParams
    result: Optional[LoadModuleResult]

    _ImplementationCls: Type[LoadModuleImplementation] = LoadModuleImplementation


class LoadModuleCreate(BaseCommandCreate[LoadModuleParams]):
    """The model for a creation request for a load module command."""

    commandType: LoadModuleCommandType = "loadModule"
    params: LoadModuleParams

    _CommandCls: Type[LoadModule] = LoadModule
