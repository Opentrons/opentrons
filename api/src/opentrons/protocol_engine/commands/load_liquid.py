"""Load liquid command request, result, and implementation models."""
from pydantic import BaseModel, Field
from typing import Optional, Type, Dict
from typing_extensions import Literal

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


LoadLiquidCommandType = Literal["loadLiquid"]


class LoadLiquidParams(BaseModel):
    """Payload required to load a liquid into a well."""

    liquidId: str = Field(
        ...,
        description="Unique identifier generated by the app of instance of liquid to load.",
    )
    labwareId: str = Field(
        ...,
        description="Unique identifier of labware to load liquid into.",
    )
    volumeByWell: Dict[str, int] = Field(
        ...,
        description="Well and associated liquid volume.",
    )


class LoadLiquidResult(BaseModel):
    """Result data from the execution of a LoadLiquid command."""

    pass


class LoadLiquidImplementation(AbstractCommandImpl[LoadLiquidParams, LoadLiquidResult]):
    """Load liquid command implementation."""

    def __init__(self, **kwargs: object) -> None:
        pass

    async def execute(self, params: LoadLiquidParams) -> LoadLiquidResult:
        """Load data necessary for a liquid."""
        return LoadLiquidResult()


class LoadLiquid(BaseCommand[LoadLiquidParams, LoadLiquidResult]):
    """Load liquid command resource model."""

    commandType: LoadLiquidCommandType = "loadLiquid"
    params: LoadLiquidParams
    result: Optional[LoadLiquidResult]

    _ImplementationCls: Type[LoadLiquidImplementation] = LoadLiquidImplementation


class LoadLiquidCreate(BaseCommandCreate[LoadLiquidParams]):
    """Load liquid command creation request."""

    commandType: LoadLiquidCommandType = "loadLiquid"
    params: LoadLiquidParams

    _CommandCls: Type[LoadLiquid] = LoadLiquid
