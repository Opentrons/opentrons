"""Magnetic Module disengage command request, result, and implementation models."""


from __future__ import annotations

from typing import Optional
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


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

    async def execute(self, params: DisengageParams) -> DisengageResult:
        """Execute a Magnetic Module disengage command."""
        raise NotImplementedError()
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
