"""Configure for volume command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import PipetteIdMixin
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence
from .configuring_common import PipetteConfigUpdateResultMixin

if TYPE_CHECKING:
    from ..execution import EquipmentHandler


ConfigureForVolumeCommandType = Literal["configureForVolume"]


class ConfigureForVolumeParams(PipetteIdMixin):
    """Parameters required to configure volume for a specific pipette."""

    volume: float = Field(
        ...,
        description="Amount of liquid in uL. Must be at least 0 and no greater "
        "than a pipette-specific maximum volume.",
        ge=0,
    )
    tipOverlapNotAfterVersion: Optional[str] = Field(
        None,
        description="A version of tip overlap data to not exceed. The highest-versioned "
        "tip overlap data that does not exceed this version will be used. Versions are "
        "expressed as vN where N is an integer, counting up from v0. If None, the current "
        "highest version will be used.",
    )


class ConfigureForVolumePrivateResult(PipetteConfigUpdateResultMixin):
    """Result sent to the store but not serialized."""

    pass


class ConfigureForVolumeResult(BaseModel):
    """Result data from execution of an ConfigureForVolume command."""

    pass


class ConfigureForVolumeImplementation(
    AbstractCommandImpl[
        ConfigureForVolumeParams,
        SuccessData[ConfigureForVolumeResult, ConfigureForVolumePrivateResult],
    ]
):
    """Configure for volume command implementation."""

    def __init__(self, equipment: EquipmentHandler, **kwargs: object) -> None:
        self._equipment = equipment

    async def execute(
        self, params: ConfigureForVolumeParams
    ) -> SuccessData[ConfigureForVolumeResult, ConfigureForVolumePrivateResult]:
        """Check that requested pipette can be configured for the given volume."""
        pipette_result = await self._equipment.configure_for_volume(
            pipette_id=params.pipetteId,
            volume=params.volume,
            tip_overlap_version=params.tipOverlapNotAfterVersion,
        )

        return SuccessData(
            public=ConfigureForVolumeResult(),
            private=ConfigureForVolumePrivateResult(
                pipette_id=pipette_result.pipette_id,
                serial_number=pipette_result.serial_number,
                config=pipette_result.static_config,
            ),
        )


class ConfigureForVolume(
    BaseCommand[ConfigureForVolumeParams, ConfigureForVolumeResult, ErrorOccurrence]
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
