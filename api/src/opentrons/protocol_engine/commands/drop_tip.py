"""Drop tip command request, result, and implementation models."""
from __future__ import annotations

from pydantic import Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from ..types import DropTipWellLocation, DeckPoint
from .pipetting_common import PipetteIdMixin, DestinationPositionResult
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from ..state import StateView
    from ..execution import MovementHandler, TipHandler


DropTipCommandType = Literal["dropTip"]


class DropTipParams(PipetteIdMixin):
    """Payload required to drop a tip in a specific well."""

    labwareId: str = Field(..., description="Identifier of labware to use.")
    wellName: str = Field(..., description="Name of well to use in labware.")
    wellLocation: DropTipWellLocation = Field(
        default_factory=DropTipWellLocation,
        description="Relative well location at which to drop the tip.",
    )
    homeAfter: Optional[bool] = Field(
        None,
        description=(
            "Whether to home this pipette's plunger after dropping the tip."
            " You should normally leave this unspecified to let the robot choose"
            " a safe default depending on its hardware."
        ),
    )
    alternateDropLocation: Optional[bool] = Field(
        False,
        description=(
            "Whether to alternate location where tip is dropped within the labware."
            " If True, this command will ignore the wellLocation provided and alternate"
            " between dropping tips at two predetermined locations inside the specified"
            " labware well."
            " If False, the tip will be dropped at the top center of the well."
        ),
    )


class DropTipResult(DestinationPositionResult):
    """Result data from the execution of a DropTip command."""

    pass


class DropTipImplementation(
    AbstractCommandImpl[DropTipParams, SuccessData[DropTipResult, None]]
):
    """Drop tip command implementation."""

    def __init__(
        self,
        state_view: StateView,
        tip_handler: TipHandler,
        movement: MovementHandler,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._tip_handler = tip_handler
        self._movement_handler = movement

    async def execute(self, params: DropTipParams) -> SuccessData[DropTipResult, None]:
        """Move to and drop a tip using the requested pipette."""
        pipette_id = params.pipetteId
        labware_id = params.labwareId
        well_name = params.wellName
        home_after = params.homeAfter

        if params.alternateDropLocation:
            well_location = self._state_view.geometry.get_next_tip_drop_location(
                labware_id=labware_id,
                well_name=well_name,
                pipette_id=pipette_id,
            )
        else:
            well_location = params.wellLocation

        is_partially_configured = self._state_view.pipettes.get_is_partially_configured(
            pipette_id=pipette_id
        )
        tip_drop_location = self._state_view.geometry.get_checked_tip_drop_location(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_location=well_location,
            partially_configured=is_partially_configured,
        )

        position = await self._movement_handler.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=tip_drop_location,
        )

        await self._tip_handler.drop_tip(pipette_id=pipette_id, home_after=home_after)

        return SuccessData(
            public=DropTipResult(
                position=DeckPoint(x=position.x, y=position.y, z=position.z)
            ),
            private=None,
        )


class DropTip(BaseCommand[DropTipParams, DropTipResult, ErrorOccurrence]):
    """Drop tip command model."""

    commandType: DropTipCommandType = "dropTip"
    params: DropTipParams
    result: Optional[DropTipResult]

    _ImplementationCls: Type[DropTipImplementation] = DropTipImplementation


class DropTipCreate(BaseCommandCreate[DropTipParams]):
    """Drop tip command creation request model."""

    commandType: DropTipCommandType = "dropTip"
    params: DropTipParams

    _CommandCls: Type[DropTip] = DropTip
