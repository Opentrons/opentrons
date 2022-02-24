"""Magnetic Module engage command request, result, and implementation models."""


from typing import Optional
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


MagneticModuleEngageCommandType = Literal["magneticModule/engageMagnet"]


class MagneticModuleEngageParams(BaseModel):
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


class MagneticModuleEngageResult(BaseModel):
    """The result of a Magnetic Module engage command."""

    pass


class MagneticModuleEngageImplementation(
    AbstractCommandImpl[MagneticModuleEngageParams, MagneticModuleEngageResult]
):
    """The implementation of a Magnetic Module engage command."""

    async def execute(
        self, params: MagneticModuleEngageParams
    ) -> MagneticModuleEngageResult:
        """Execute a Magnetic Module engage command."""
        raise NotImplementedError(
            "Protocol Engine does not yet support engaging magnets."
        )


class MagneticModuleEngage(
    BaseCommand[MagneticModuleEngageParams, MagneticModuleEngageResult]
):
    """A command to engage a Magnetic Module's magnets."""

    commandType: MagneticModuleEngageCommandType = "magneticModule/engageMagnet"
    params: MagneticModuleEngageParams
    result: Optional[MagneticModuleEngageResult]

    _ImplementationCls: Type[
        MagneticModuleEngageImplementation
    ] = MagneticModuleEngageImplementation


class MagneticModuleEngageCreate(BaseCommandCreate[MagneticModuleEngageParams]):
    """A request to create a Magnetic Module engage command."""

    commandType: MagneticModuleEngageCommandType = "magneticModule/engageMagnet"
    params: MagneticModuleEngageParams

    _CommandCls: Type[MagneticModuleEngage] = MagneticModuleEngage
