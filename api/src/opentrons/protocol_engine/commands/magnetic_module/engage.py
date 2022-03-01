"""Magnetic Module engage command request, result, and implementation models."""


from typing import Optional
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from opentrons.protocol_engine.execution import EquipmentHandler
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


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

    def __init__(self, equipment: EquipmentHandler, **unused_handlers: object) -> None:
        self._equipment = equipment

    async def execute(self, params: EngageParams) -> EngageResult:
        """Execute a Magnetic Module engage command."""
        await self._equipment.engage_magnets(
            magnetic_module_id=params.moduleId,
            mm_above_labware_base=params.engageHeight,
        )
        return EngageResult()


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
