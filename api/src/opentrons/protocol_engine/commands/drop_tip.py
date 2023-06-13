"""Drop tip command request, result, and implementation models."""
from __future__ import annotations

from pydantic import Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from ..types import DropTipWellLocation, DeckPoint
from .pipetting_common import PipetteIdMixin, DestinationPositionResult
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

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
    randomizeDropLocation: Optional[bool] = Field(
        False,
        description=(
            "Whether to randomize the location where tip is dropped within the labware."
            " If True, this command will ignore the wellLocation provided and"
            " drop tip at a random location within a set area of the specified labware well."
            " If False, the tip will be dropped at the top center of the well."
        ),
    )


class DropTipResult(DestinationPositionResult):
    """Result data from the execution of a DropTip command."""

    pass


class DropTipImplementation(AbstractCommandImpl[DropTipParams, DropTipResult]):
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

    async def execute(self, params: DropTipParams) -> DropTipResult:
        """Move to and drop a tip using the requested pipette."""
        pipette_id = params.pipetteId
        labware_id = params.labwareId
        well_name = params.wellName
        home_after = params.homeAfter

        if params.randomizeDropLocation:
            # TODO (spp, 2023-05-30): we might make this cycle through pre-defined
            #  locations to drop tip instead of a completely random location.
            #  That would make sw as well as hw testing more robust.
            drop_tip_well_location = (
                self._state_view.labware.get_random_drop_tip_location(
                    labware_id=labware_id,
                    well_name=well_name,
                )
            )
        else:
            drop_tip_well_location = params.wellLocation

        well_location = self._state_view.geometry.get_tip_drop_location(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_location=drop_tip_well_location,
        )

        position = await self._movement_handler.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )

        await self._tip_handler.drop_tip(pipette_id=pipette_id, home_after=home_after)

        return DropTipResult(
            position=DeckPoint(x=position.x, y=position.y, z=position.z)
        )


class DropTip(BaseCommand[DropTipParams, DropTipResult]):
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
