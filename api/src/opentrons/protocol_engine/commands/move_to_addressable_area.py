"""Move to addressable area command request, result, and implementation models."""
from __future__ import annotations
from pydantic import Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from ..errors import LocationNotAccessibleByPipetteError
from ..types import DeckPoint, AddressableOffsetVector
from ..resources import fixture_validation
from .pipetting_common import (
    PipetteIdMixin,
    MovementMixin,
    DestinationPositionResult,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from ..execution import MovementHandler
    from ..state import StateView

MoveToAddressableAreaCommandType = Literal["moveToAddressableArea"]


class MoveToAddressableAreaParams(PipetteIdMixin, MovementMixin):
    """Payload required to move a pipette to a specific addressable area.

    An *addressable area* is a space in the robot that may or may not be usable depending on how
    the robot's deck is configured. For example, if a Flex is configured with a waste chute, it will
    have additional addressable areas representing the opening of the waste chute, where tips and
    labware can be dropped.

    This moves the pipette so all of its nozzles are centered over the addressable area.
    If the pipette is currently configured with a partial tip layout, this centering is over all
    the pipette's physical nozzles, not just the nozzles that are active.

    The z-position will be chosen to put the bottom of the tips---or the bottom of the nozzles,
    if there are no tips---level with the top of the addressable area.

    When this command is executed, Protocol Engine will make sure the robot's deck is configured
    such that the requested addressable area actually exists. For example, if you request
    the addressable area B4, it will make sure the robot is set up with a B3/B4 staging area slot.
    If that's not the case, the command will fail.
    """

    addressableAreaName: str = Field(
        ...,
        description=(
            "The name of the addressable area that you want to use."
            " Valid values are the `id`s of `addressableArea`s in the"
            " [deck definition](https://github.com/Opentrons/opentrons/tree/edge/shared-data/deck)."
        ),
    )
    offset: AddressableOffsetVector = Field(
        AddressableOffsetVector(x=0, y=0, z=0),
        description="Relative offset of addressable area to move pipette's critical point.",
    )
    stayAtHighestPossibleZ: bool = Field(
        False,
        description=(
            "If `true`, the pipette will retract to its highest possible height"
            " and stay there instead of descending to the destination."
            " `minimumZHeight` will be ignored."
        ),
    )


class MoveToAddressableAreaResult(DestinationPositionResult):
    """Result data from the execution of a MoveToAddressableArea command."""

    pass


class MoveToAddressableAreaImplementation(
    AbstractCommandImpl[
        MoveToAddressableAreaParams, SuccessData[MoveToAddressableAreaResult, None]
    ]
):
    """Move to addressable area command implementation."""

    def __init__(
        self, movement: MovementHandler, state_view: StateView, **kwargs: object
    ) -> None:
        self._movement = movement
        self._state_view = state_view

    async def execute(
        self, params: MoveToAddressableAreaParams
    ) -> SuccessData[MoveToAddressableAreaResult, None]:
        """Move the requested pipette to the requested addressable area."""
        self._state_view.addressable_areas.raise_if_area_not_in_deck_configuration(
            params.addressableAreaName
        )

        if fixture_validation.is_staging_slot(params.addressableAreaName):
            raise LocationNotAccessibleByPipetteError(
                f"Cannot move pipette to staging slot {params.addressableAreaName}"
            )

        x, y, z = await self._movement.move_to_addressable_area(
            pipette_id=params.pipetteId,
            addressable_area_name=params.addressableAreaName,
            offset=params.offset,
            force_direct=params.forceDirect,
            minimum_z_height=params.minimumZHeight,
            speed=params.speed,
            stay_at_highest_possible_z=params.stayAtHighestPossibleZ,
        )

        return SuccessData(
            public=MoveToAddressableAreaResult(position=DeckPoint(x=x, y=y, z=z)),
            private=None,
        )


class MoveToAddressableArea(
    BaseCommand[
        MoveToAddressableAreaParams, MoveToAddressableAreaResult, ErrorOccurrence
    ]
):
    """Move to addressable area command model."""

    commandType: MoveToAddressableAreaCommandType = "moveToAddressableArea"
    params: MoveToAddressableAreaParams
    result: Optional[MoveToAddressableAreaResult]

    _ImplementationCls: Type[
        MoveToAddressableAreaImplementation
    ] = MoveToAddressableAreaImplementation


class MoveToAddressableAreaCreate(BaseCommandCreate[MoveToAddressableAreaParams]):
    """Move to addressable area command creation request model."""

    commandType: MoveToAddressableAreaCommandType = "moveToAddressableArea"
    params: MoveToAddressableAreaParams

    _CommandCls: Type[MoveToAddressableArea] = MoveToAddressableArea
