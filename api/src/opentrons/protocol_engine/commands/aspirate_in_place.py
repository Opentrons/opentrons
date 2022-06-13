"""Aspirate-in-place command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import (
    PipetteIdMixin,
    VolumeMixin,
    BaseLiquidHandlingResult,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import PipettingHandler


AspirateInPlaceCommandType = Literal["aspirateInPlace"]


class AspirateInPlaceParams(PipetteIdMixin, VolumeMixin):
    """Parameters required for the aspirateInPlace command."""

    pass


class AspirateInPlaceResult(BaseLiquidHandlingResult):
    """Result data from execution of an aspirateInPlace command."""

    pass


class AspirateInPlaceImplementation(
    AbstractCommandImpl[AspirateInPlaceParams, AspirateInPlaceResult]
):
    """aspirateInPlace command implementation."""

    def __init__(self, pipetting: PipettingHandler, **kwargs: object) -> None:
        self._pipetting = pipetting

    async def execute(self, params: AspirateInPlaceParams) -> AspirateInPlaceResult:
        """Move to and aspirate in place."""
        volume = await self._pipetting.aspirate_in_place(
            pipette_id=params.pipetteId, volume=params.volume
        )
        return AspirateInPlaceResult(volume=volume)


class AspirateInPlace(BaseCommand[AspirateInPlaceParams, AspirateInPlaceResult]):
    """aspirateInPlace command model."""

    commandType: AspirateInPlaceCommandType = "aspirateInPlace"
    params: AspirateInPlaceParams
    result: Optional[AspirateInPlaceResult]

    _ImplementationCls: Type[
        AspirateInPlaceImplementation
    ] = AspirateInPlaceImplementation


class AspirateInPlaceCreate(BaseCommandCreate[AspirateInPlaceParams]):
    """Request model to create an aspirateInPlace command."""

    commandType: AspirateInPlaceCommandType = "aspirateInPlace"
    params: AspirateInPlaceParams

    _CommandCls: Type[AspirateInPlace] = AspirateInPlace
