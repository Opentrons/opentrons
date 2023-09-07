"""Configure for volume command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import (
    PipetteIdMixin,
    VolumeMixin,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import EquipmentHandler


ConfigureForVolumeCommandType = Literal["configureForVolume"]


class ConfigureForVolumeParams(PipetteIdMixin, VolumeMixin):
    """Parameters required to configure volume for a specific pipette."""

    pass


class ConfigureForVolumeResult(BaseModel):
    """Result data from execution of an ConfigureForVolume command."""

    pipetteId: str = Field(
        ...,
        description="An ID to reference this pipette in subsequent commands.",
    )


class ConfigureForVolumeImplementation(
    AbstractCommandImpl[ConfigureForVolumeParams, ConfigureForVolumeResult]
):
    """Configure for volume command implementation."""

    def __init__(self, equipment: EquipmentHandler, **kwargs: object) -> None:
        self._equipment = equipment

    async def execute(
        self, params: ConfigureForVolumeParams
    ) -> ConfigureForVolumeResult:
        """Check that requested pipette can be configured for the given volume."""
        configured_pipette = await self._equipment.configure_for_volume(
            pipette_id=params.pipetteId,
            volume=params.volume,
        )

        return ConfigureForVolumeResult(pipetteId=configured_pipette.pipette_id)


class ConfigureForVolume(
    BaseCommand[ConfigureForVolumeParams, ConfigureForVolumeResult]
):
    """Configure for volume command model."""

    commandType: ConfigureForVolumeCommandType = "configureForVolume"
    params: ConfigureForVolumeParams
    result: Optional[ConfigureForVolumeResult]

    _ImplementationCls: Type[
        ConfigureForVolumeImplementation
    ] = ConfigureForVolumeImplementation


class ConfigureForVolumeCreate(BaseCommandCreate[ConfigureForVolumeParams]):
    """Configure for volume command creation request model."""

    commandType: ConfigureForVolumeCommandType = "configureForVolume"
    params: ConfigureForVolumeParams

    _CommandCls: Type[ConfigureForVolume] = ConfigureForVolume
