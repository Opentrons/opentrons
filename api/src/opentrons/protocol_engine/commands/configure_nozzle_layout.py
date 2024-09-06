"""Configure nozzle layout command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import TYPE_CHECKING, Optional, Type, Union
from typing_extensions import Literal

from .pipetting_common import (
    PipetteIdMixin,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence
from .configuring_common import (
    PipetteNozzleLayoutResultMixin,
)
from ..types import (
    AllNozzleLayoutConfiguration,
    SingleNozzleLayoutConfiguration,
    RowNozzleLayoutConfiguration,
    ColumnNozzleLayoutConfiguration,
    QuadrantNozzleLayoutConfiguration,
)

if TYPE_CHECKING:
    from ..execution import EquipmentHandler, TipHandler


ConfigureNozzleLayoutCommandType = Literal["configureNozzleLayout"]


class ConfigureNozzleLayoutParams(PipetteIdMixin):
    """Parameters required to configure the nozzle layout for a specific pipette."""

    configurationParams: Union[
        AllNozzleLayoutConfiguration,
        SingleNozzleLayoutConfiguration,
        RowNozzleLayoutConfiguration,
        ColumnNozzleLayoutConfiguration,
        QuadrantNozzleLayoutConfiguration,
    ]


class ConfigureNozzleLayoutPrivateResult(PipetteNozzleLayoutResultMixin):
    """Result sent to the store but not serialized."""

    pass


class ConfigureNozzleLayoutResult(BaseModel):
    """Result data from execution of an configureNozzleLayout command."""

    pass


class ConfigureNozzleLayoutImplementation(
    AbstractCommandImpl[
        ConfigureNozzleLayoutParams,
        SuccessData[ConfigureNozzleLayoutResult, ConfigureNozzleLayoutPrivateResult],
    ]
):
    """Configure nozzle layout command implementation."""

    def __init__(
        self, equipment: EquipmentHandler, tip_handler: TipHandler, **kwargs: object
    ) -> None:
        self._equipment = equipment
        self._tip_handler = tip_handler

    async def execute(
        self, params: ConfigureNozzleLayoutParams
    ) -> SuccessData[ConfigureNozzleLayoutResult, ConfigureNozzleLayoutPrivateResult]:
        """Check that requested pipette can support the requested nozzle layout."""
        primary_nozzle = params.configurationParams.dict().get("primaryNozzle")
        front_right_nozzle = params.configurationParams.dict().get("frontRightNozzle")
        back_left_nozzle = params.configurationParams.dict().get("backLeftNozzle")
        nozzle_params = await self._tip_handler.available_for_nozzle_layout(
            pipette_id=params.pipetteId,
            style=params.configurationParams.style,
            primary_nozzle=primary_nozzle,
            front_right_nozzle=front_right_nozzle,
            back_left_nozzle=back_left_nozzle,
        )

        nozzle_map = await self._equipment.configure_nozzle_layout(
            pipette_id=params.pipetteId,
            **nozzle_params,
        )

        return SuccessData(
            public=ConfigureNozzleLayoutResult(),
            private=ConfigureNozzleLayoutPrivateResult(
                pipette_id=params.pipetteId,
                nozzle_map=nozzle_map,
            ),
        )


class ConfigureNozzleLayout(
    BaseCommand[
        ConfigureNozzleLayoutParams, ConfigureNozzleLayoutResult, ErrorOccurrence
    ]
):
    """Configure nozzle layout command model."""

    commandType: ConfigureNozzleLayoutCommandType = "configureNozzleLayout"
    params: ConfigureNozzleLayoutParams
    result: Optional[ConfigureNozzleLayoutResult] = None

    _ImplementationCls: Type[
        ConfigureNozzleLayoutImplementation
    ] = ConfigureNozzleLayoutImplementation


class ConfigureNozzleLayoutCreate(BaseCommandCreate[ConfigureNozzleLayoutParams]):
    """Configure nozzle layout creation request model."""

    commandType: ConfigureNozzleLayoutCommandType = "configureNozzleLayout"
    params: ConfigureNozzleLayoutParams

    _CommandCls: Type[ConfigureNozzleLayout] = ConfigureNozzleLayout
