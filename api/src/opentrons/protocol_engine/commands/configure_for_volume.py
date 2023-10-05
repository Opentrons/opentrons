"""Configure for volume command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import TYPE_CHECKING, Optional, Type, Tuple
from typing_extensions import Literal

from .pipetting_common import (
    PipetteIdMixin,
    VolumeMixin,
)
from .command import (
    AbstractCommandWithPrivateResultImpl,
    BaseCommand,
    BaseCommandCreate,
)
from .configuring_common import PipetteConfigUpdateResultMixin

if TYPE_CHECKING:
    from ..execution import EquipmentHandler


ConfigureForVolumeCommandType = Literal["configureForVolume"]


class ConfigureForVolumeParams(PipetteIdMixin, VolumeMixin):
    """Parameters required to configure volume for a specific pipette."""

    pass


class ConfigureForVolumePrivateResult(PipetteConfigUpdateResultMixin):
    """Result sent to the store but not serialized."""

    pass


class ConfigureForVolumeResult(BaseModel):
    """Result data from execution of an ConfigureForVolume command."""

    pass


class ConfigureForVolumeImplementation(
    AbstractCommandWithPrivateResultImpl[
        ConfigureForVolumeParams,
        ConfigureForVolumeResult,
        ConfigureForVolumePrivateResult,
    ]
):
    """Configure for volume command implementation."""

    def __init__(self, equipment: EquipmentHandler, **kwargs: object) -> None:
        self._equipment = equipment

    async def execute(
        self, params: ConfigureForVolumeParams
    ) -> Tuple[ConfigureForVolumeResult, ConfigureForVolumePrivateResult]:
        """Check that requested pipette can be configured for the given volume."""
        pipette_result = await self._equipment.configure_for_volume(
            pipette_id=params.pipetteId,
            volume=params.volume,
        )

        return ConfigureForVolumeResult(), ConfigureForVolumePrivateResult(
            pipette_id=pipette_result.pipette_id,
            serial_number=pipette_result.serial_number,
            config=pipette_result.static_config,
        )


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
