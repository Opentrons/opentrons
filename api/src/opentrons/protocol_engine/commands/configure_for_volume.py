"""Configure for volume command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type, Union
from typing_extensions import Literal

from opentrons.types import MountType

from opentrons_shared_data.pipette.dev_types import PipetteNameType
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

    # TODO (tz, 11-23-22): remove Union when refactoring load_pipette for 96 channels.
    # https://opentrons.atlassian.net/browse/RLIQ-255
    pipetteName: Union[PipetteNameType, Literal["p1000_96"]] = Field(
        ...,
        description="The load name of the pipette to be required.",
    )
    mount: MountType = Field(
        ...,
        description="The mount the pipette should be present on.",
    )


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
            pipette_name=params.pipetteName,
            mount=params.mount,
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
