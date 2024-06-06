"""Blow-out command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from ..types import DeckPoint
from .pipetting_common import (
    PipetteIdMixin,
    FlowRateMixin,
    WellLocationMixin,
    DestinationPositionResult,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence

from opentrons.hardware_control import HardwareControlAPI


if TYPE_CHECKING:
    from ..execution import MovementHandler, PipettingHandler
    from ..state import StateView

BlowOutCommandType = Literal["blowout"]


class BlowOutParams(PipetteIdMixin, FlowRateMixin, WellLocationMixin):
    """Payload required to blow-out a specific well."""

    pass


class BlowOutResult(DestinationPositionResult):
    """Result data from the execution of a blow-out command."""

    pass


class BlowOutImplementation(
    AbstractCommandImpl[BlowOutParams, SuccessData[BlowOutResult, None]]
):
    """BlowOut command implementation."""

    def __init__(
        self,
        movement: MovementHandler,
        pipetting: PipettingHandler,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        **kwargs: object,
    ) -> None:
        self._movement = movement
        self._pipetting = pipetting
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(self, params: BlowOutParams) -> SuccessData[BlowOutResult, None]:
        """Move to and blow-out the requested well."""
        x, y, z = await self._movement.move_to_well(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
        )

        await self._pipetting.blow_out_in_place(
            pipette_id=params.pipetteId, flow_rate=params.flowRate
        )

        return SuccessData(
            public=BlowOutResult(position=DeckPoint(x=x, y=y, z=z)), private=None
        )


class BlowOut(BaseCommand[BlowOutParams, BlowOutResult, ErrorOccurrence]):
    """Blow-out command model."""

    commandType: BlowOutCommandType = "blowout"
    params: BlowOutParams
    result: Optional[BlowOutResult]

    _ImplementationCls: Type[BlowOutImplementation] = BlowOutImplementation


class BlowOutCreate(BaseCommandCreate[BlowOutParams]):
    """Create blow-out command request model."""

    commandType: BlowOutCommandType = "blowout"
    params: BlowOutParams

    _CommandCls: Type[BlowOut] = BlowOut
