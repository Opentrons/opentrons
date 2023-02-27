"""Pick up tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from ..types import DeckPoint
from .pipetting_common import (
    PipetteIdMixin,
    WellLocationMixin,
    DestinationPositionResult,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..state import StateView
    from ..execution import MovementHandler, TipHandler


PickUpTipCommandType = Literal["pickUpTip"]


class PickUpTipParams(PipetteIdMixin, WellLocationMixin):
    """Payload needed to move a pipette to a specific well."""

    pass


class PickUpTipResult(DestinationPositionResult):
    """Result data from the execution of a PickUpTip."""

    # Tip volume has a default ONLY for parsing data from earlier versions, which did not include this in the result
    tipVolume: float = Field(
        0,
        description="Maximum volume of liquid that the picked up tip can hold, in µL.",
        ge=0,
    )

    tipLength: float = Field(
        0,
        description="The length of the tip in mm.",
        ge=0,
    )

    tipDiameter: float = Field(
        0,
        description="The diameter of the tip in mm.",
        ge=0,
    )


class PickUpTipImplementation(AbstractCommandImpl[PickUpTipParams, PickUpTipResult]):
    """Pick up tip command implementation."""

    def __init__(
        self,
        state_view: StateView,
        tip_handler: TipHandler,
        movement: MovementHandler,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._tip_handler = tip_handler
        self._movement = movement

    async def execute(self, params: PickUpTipParams) -> PickUpTipResult:
        """Move to and pick up a tip using the requested pipette."""
        pipette_id = params.pipetteId
        labware_id = params.labwareId
        well_name = params.wellName
        well_location = params.wellLocation

        position = await self._movement.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )

        tip_geometry = await self._tip_handler.pick_up_tip(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
        )

        return PickUpTipResult(
            tipVolume=tip_geometry.volume,
            tipLength=tip_geometry.length,
            tipDiameter=tip_geometry.diameter,
            position=DeckPoint(x=position.x, y=position.y, z=position.z),
        )


class PickUpTip(BaseCommand[PickUpTipParams, PickUpTipResult]):
    """Pick up tip command model."""

    commandType: PickUpTipCommandType = "pickUpTip"
    params: PickUpTipParams
    result: Optional[PickUpTipResult]

    _ImplementationCls: Type[PickUpTipImplementation] = PickUpTipImplementation


class PickUpTipCreate(BaseCommandCreate[PickUpTipParams]):
    """Pick up tip command creation request model."""

    commandType: PickUpTipCommandType = "pickUpTip"
    params: PickUpTipParams

    _CommandCls: Type[PickUpTip] = PickUpTip
