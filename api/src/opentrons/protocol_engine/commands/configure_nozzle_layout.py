"""Configure nozzle layout command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import TYPE_CHECKING, Optional, Type, Tuple, Union
from typing_extensions import Literal

from opentrons.hardware_control.instruments.nozzle_manager import (
    NozzleConfigurationType,
)
from .pipetting_common import (
    PipetteIdMixin,
)
from .command import (
    AbstractCommandWithPrivateResultImpl,
    BaseCommand,
    BaseCommandCreate,
)
from .configuring_common import (
    BaseNozzleLayoutConfiguration,
    RowColumnNozzleLayoutConfiguration,
    QuadrantNozzleLayoutConfiguration,
)

if TYPE_CHECKING:
    from ..execution import EquipmentHandler


ConfigureNozzleLayoutCommandType = Literal["configureNozzleLayout"]


class ConfigureNozzleLayoutParams(PipetteIdMixin):
    """Parameters required to configure the nozzle layout for a specific pipette."""

    configuration_type: NozzleConfigurationType
    configuration_params: Union[
        BaseNozzleLayoutConfiguration,
        RowColumnNozzleLayoutConfiguration,
        QuadrantNozzleLayoutConfiguration,
    ]


class ConfigureNozzleLayoutPrivateResult(BaseModel):
    """Result sent to the store but not serialized."""

    configuration_params: Union[
        BaseNozzleLayoutConfiguration,
        RowColumnNozzleLayoutConfiguration,
        QuadrantNozzleLayoutConfiguration,
    ]


class ConfigureNozzleLayoutResult(BaseModel):
    """Result data from execution of an ConfigureForVolume command."""

    pass


class ConfigureNozzleLayoutImplementation(
    AbstractCommandWithPrivateResultImpl[
        ConfigureNozzleLayoutParams,
        ConfigureNozzleLayoutResult,
        ConfigureNozzleLayoutPrivateResult,
    ]
):
    """Configure for volume command implementation."""

    def __init__(self, equipment: EquipmentHandler, **kwargs: object) -> None:
        self._equipment = equipment

    async def execute(
        self, params: ConfigureNozzleLayoutParams
    ) -> Tuple[ConfigureNozzleLayoutResult, ConfigureNozzleLayoutPrivateResult]:
        """Check that requested pipette can support the requested nozzle layout."""
        pipette_result = await self._equipment.configure_nozzle_layout(
            pipette_id=params.pipetteId,
            volume=params.volume,
        )

        return ConfigureNozzleLayoutResult(), ConfigureNozzleLayoutPrivateResult(
            pipette_id=pipette_result.pipette_id,
            serial_number=pipette_result.serial_number,
            config=pipette_result.static_config,
        )


class ConfigureNozzleLayout(
    BaseCommand[ConfigureNozzleLayoutParams, ConfigureNozzleLayoutResult]
):
    """Configure nozzle layout command model."""

    commandType: ConfigureNozzleLayoutCommandType = "configureNozzleLayout"
    params: ConfigureNozzleLayoutParams
    result: Optional[ConfigureNozzleLayoutResult]

    _ImplementationCls: Type[
        ConfigureNozzleLayoutImplementation
    ] = ConfigureNozzleLayoutImplementation


class ConfigureForVolumeCreate(BaseCommandCreate[ConfigureNozzleLayoutParams]):
    """Configure nozzle layout creation request model."""

    commandType: ConfigureNozzleLayoutCommandType = "configureNozzleLayout"
    params: ConfigureNozzleLayoutParams

    _CommandCls: Type[ConfigureNozzleLayout] = ConfigureNozzleLayout
