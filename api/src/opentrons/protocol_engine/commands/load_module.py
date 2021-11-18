"""Implementation, request models, and response models for the load module command."""

from typing import Optional, Type
from typing_extensions import Literal
from pydantic import BaseModel, Field

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate
from ..types import DeckSlotLocation


LoadModuleCommandType = Literal["loadModule"]


class LoadModuleParams(BaseModel):
    """Payload required to load a module."""

    # todo(mm, 2021-11-01): Use an enum instead of a str. shared-data defines the
    # possible model names.
    model: str = Field(
        ...,
        example="magneticModuleV1",
        description=(
            "The model name of the module to load."
            "\n\n"
            "If a different version of this module is physically connected,"
            " the load will succeed"
            " if it's deemed compatible with the version you requested."
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


class LoadModuleImplementation(AbstractCommandImpl[LoadModuleParams, LoadModuleResult]):
    """The implementation of the load module command."""

    async def execute(self, params: LoadModuleParams) -> LoadModuleResult:
        """Check that the requested module is attached and assign its identifier."""
        raise NotImplementedError("LoadModule command not yet implemented")


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
