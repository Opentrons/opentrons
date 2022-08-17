"""Dispense-in-place command request, result, and implementation models."""

# TODO(mm, 2022-08-15): This command is not yet in the JSON protocol schema.
# Before our production code emits this command, we must add it to the schema,
# and probably bump the schema version.

from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import (
    PipetteIdMixin,
    VolumeMixin,
    FlowRateMixin,
    BaseLiquidHandlingResult,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import PipettingHandler


DispenseInPlaceCommandType = Literal["dispenseInPlace"]


class DispenseInPlaceParams(PipetteIdMixin, VolumeMixin, FlowRateMixin):
    """Payload required to dispense in place."""

    pass


class DispenseInPlaceResult(BaseLiquidHandlingResult):
    """Result data from the execution of a DispenseInPlace command."""

    pass


class DispenseInPlaceImplementation(
    AbstractCommandImpl[DispenseInPlaceParams, DispenseInPlaceResult]
):
    """DispenseInPlace command implementation."""

    def __init__(self, pipetting: PipettingHandler, **kwargs: object) -> None:
        self._pipetting = pipetting

    async def execute(self, params: DispenseInPlaceParams) -> DispenseInPlaceResult:
        """Dispense without moving the pipette."""
        volume = await self._pipetting.dispense_in_place(
            pipette_id=params.pipetteId,
            volume=params.volume,
            flow_rate=params.flowRate,
        )
        return DispenseInPlaceResult(volume=volume)


class DispenseInPlace(BaseCommand[DispenseInPlaceParams, DispenseInPlaceResult]):
    """DispenseInPlace command model."""

    commandType: DispenseInPlaceCommandType = "dispenseInPlace"
    params: DispenseInPlaceParams
    result: Optional[DispenseInPlaceResult]

    _ImplementationCls: Type[
        DispenseInPlaceImplementation
    ] = DispenseInPlaceImplementation


class DispenseInPlaceCreate(BaseCommandCreate[DispenseInPlaceParams]):
    """DispenseInPlace command request model."""

    commandType: DispenseInPlaceCommandType = "dispenseInPlace"
    params: DispenseInPlaceParams

    _CommandCls: Type[DispenseInPlace] = DispenseInPlace
