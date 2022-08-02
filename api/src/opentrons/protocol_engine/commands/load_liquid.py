"""Load liquid command request, result, and implementation models."""
from pydantic import BaseModel, Field
from typing import Optional, Type
from typing_extensions import Literal

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


LoadLiquidCommandType = Literal["loadLiquid"]


class Liquid(BaseModel):
    """Payload required to create a liquid."""

    liquidId: str = Field(
        ...,
        description="Unique identifier generated by the app of instance of liquid to create.",
    )
    displayName: str = Field(
        ...,
        description="An human-readable name for this liquid.",
    )
    description: str = Field(
        ...,
        description="A description of this liquid.",
    )
    displayColor: Optional[str] = Field(
        ...,
        description="Hex color code, with hash included, to represent the specified liquid. Standard three-value, four-value, six-value, and eight-value syntax are all acceptable.",
    )


class VolumeByWell(BaseModel):
    """Request data of well and associated volume."""

    wellId: int = Field(
        ...,
        description="Well id to capture liquid.",
    )
    volume: int = Field(
        ...,
        description="Volume within associated well.",
    )


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
    volumeByWell: VolumeByWell = Field(
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
        """Load definition and calibration data necessary for a liquid."""
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
