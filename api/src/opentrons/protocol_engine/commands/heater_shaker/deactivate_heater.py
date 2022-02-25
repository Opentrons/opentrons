"""Command models to stop heating Heater-Shaker Module."""
from typing import Optional
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


DeactivateHeaterCommandType = Literal["heaterShakerModule/deactivateHeater"]


class DeactivateHeaterParams(BaseModel):
    """Input parameters to unset a Heater-Shaker's target temperature."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")


class DeactivateHeaterResult(BaseModel):
    """Result data from unsetting a Heater-Shaker's target temperature."""


class DeactivateHeaterImpl(
    AbstractCommandImpl[DeactivateHeaterParams, DeactivateHeaterResult]
):
    """Execution implementation of a Heater-Shaker's deactivate heater command."""

    def __init__(self, **kwargs: object) -> None:
        pass

    async def execute(self, params: DeactivateHeaterParams) -> DeactivateHeaterResult:
        """Unset a Heater-Shaker's target temperature."""
        raise NotImplementedError(
            "Heater-Shaker deactivate heater not yet implemented."
        )


class DeactivateHeater(BaseCommand[DeactivateHeaterParams, DeactivateHeaterResult]):
    """A command to unset a Heater-Shaker's target temperature."""

    commandType: DeactivateHeaterCommandType = "heaterShakerModule/deactivateHeater"
    params: DeactivateHeaterParams
    result: Optional[DeactivateHeaterResult]

    _ImplementationCls: Type[DeactivateHeaterImpl] = DeactivateHeaterImpl


class DeactivateHeaterCreate(BaseCommandCreate[DeactivateHeaterParams]):
    """A request to create a Heater-Shaker's deactivate heater command."""

    commandType: DeactivateHeaterCommandType
    params: DeactivateHeaterParams

    _CommandCls: Type[DeactivateHeater] = DeactivateHeater
