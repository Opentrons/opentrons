"""Aspirate command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import (
    PipetteIdMixin,
    VolumeMixin,
    FlowRateMixin,
    WellLocationMixin,
    BaseLiquidHandlingResult,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import PipettingHandler


AspirateCommandType = Literal["aspirate"]


class AspirateParams(PipetteIdMixin, VolumeMixin, FlowRateMixin, WellLocationMixin):
    """Parameters required to aspirate from a specific well."""

    pass


class AspirateResult(BaseLiquidHandlingResult):
    """Result data from execution of an Aspirate command."""

    pass


class AspirateImplementation(AbstractCommandImpl[AspirateParams, AspirateResult]):
    """Aspirate command implementation."""

    def __init__(self, pipetting: PipettingHandler, **kwargs: object) -> None:
        self._pipetting = pipetting

    async def execute(self, params: AspirateParams) -> AspirateResult:
        """Move to and aspirate from the requested well."""
        volume = await self._pipetting.aspirate(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
            volume=params.volume,
            flow_rate=params.flowRate,
        )

        return AspirateResult(volume=volume)


class Aspirate(BaseCommand[AspirateParams, AspirateResult]):
    """Aspirate command model."""

    commandType: AspirateCommandType = "aspirate"
    params: AspirateParams
    result: Optional[AspirateResult]

    _ImplementationCls: Type[AspirateImplementation] = AspirateImplementation


class AspirateCreate(BaseCommandCreate[AspirateParams]):
    """Create aspirate command request model."""

    commandType: AspirateCommandType = "aspirate"
    params: AspirateParams

    _CommandCls: Type[Aspirate] = Aspirate
