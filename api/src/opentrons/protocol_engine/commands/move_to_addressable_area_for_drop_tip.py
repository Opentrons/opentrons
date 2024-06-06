"""Move to addressable area for drop tip command request, result, and implementation models."""
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

MoveToAddressableAreaForDropTipCommandType = Literal["moveToAddressableAreaForDropTip"]


class MoveToAddressableAreaForDropTipParams(PipetteIdMixin, MovementMixin):
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
    alternateDropLocation: Optional[bool] = Field(
        False,
        description=(
            "Whether to alternate location where tip is dropped within the addressable area."
            " If True, this command will ignore the offset provided and alternate"
            " between dropping tips at two predetermined locations inside the specified"
            " labware well."
            " If False, the tip will be dropped at the top center of the area."
        ),
    )
    ignoreTipConfiguration: Optional[bool] = Field(
        True,
        description=(
            "Whether to utilize the critical point of the tip configuraiton when moving to an addressable area."
            " If True, this command will ignore the tip configuration and use the center of the entire instrument"
            " as the critical point for movement."
            " If False, this command will use the critical point provided by the current tip configuration."
        ),
    )


class MoveToAddressableAreaForDropTipResult(DestinationPositionResult):
    """Result data from the execution of a MoveToAddressableAreaForDropTip command."""

    pass


class MoveToAddressableAreaForDropTipImplementation(
    AbstractCommandImpl[
        MoveToAddressableAreaForDropTipParams,
        SuccessData[MoveToAddressableAreaForDropTipResult, None],
    ]
):
    """Move to addressable area for drop tip command implementation."""

    def __init__(
        self, movement: MovementHandler, state_view: StateView, **kwargs: object
    ) -> None:
        self._movement = movement
        self._state_view = state_view

    async def execute(
        self, params: MoveToAddressableAreaForDropTipParams
    ) -> SuccessData[MoveToAddressableAreaForDropTipResult, None]:
        """Move the requested pipette to the requested addressable area in preperation of a drop tip."""
        self._state_view.addressable_areas.raise_if_area_not_in_deck_configuration(
            params.addressableAreaName
        )

        if fixture_validation.is_staging_slot(params.addressableAreaName):
            raise LocationNotAccessibleByPipetteError(
                f"Cannot move pipette to staging slot {params.addressableAreaName}"
            )

        if params.alternateDropLocation:
            offset = self._state_view.geometry.get_next_tip_drop_location_for_addressable_area(
                addressable_area_name=params.addressableAreaName,
                pipette_id=params.pipetteId,
            )
        else:
            offset = params.offset

        x, y, z = await self._movement.move_to_addressable_area(
            pipette_id=params.pipetteId,
            addressable_area_name=params.addressableAreaName,
            offset=offset,
            force_direct=params.forceDirect,
            minimum_z_height=params.minimumZHeight,
            speed=params.speed,
            ignore_tip_configuration=params.ignoreTipConfiguration,
        )

        return SuccessData(
            public=MoveToAddressableAreaForDropTipResult(
                position=DeckPoint(x=x, y=y, z=z)
            ),
            private=None,
        )


class MoveToAddressableAreaForDropTip(
    BaseCommand[
        MoveToAddressableAreaForDropTipParams,
        MoveToAddressableAreaForDropTipResult,
        ErrorOccurrence,
    ]
):
    """Move to addressable area for drop tip command model."""

    commandType: MoveToAddressableAreaForDropTipCommandType = (
        "moveToAddressableAreaForDropTip"
    )
    params: MoveToAddressableAreaForDropTipParams
    result: Optional[MoveToAddressableAreaForDropTipResult]

    _ImplementationCls: Type[
        MoveToAddressableAreaForDropTipImplementation
    ] = MoveToAddressableAreaForDropTipImplementation


class MoveToAddressableAreaForDropTipCreate(
    BaseCommandCreate[MoveToAddressableAreaForDropTipParams]
):
    """Move to addressable area for drop tip command creation request model."""

    commandType: MoveToAddressableAreaForDropTipCommandType = (
        "moveToAddressableAreaForDropTip"
    )
    params: MoveToAddressableAreaForDropTipParams

    _CommandCls: Type[MoveToAddressableAreaForDropTip] = MoveToAddressableAreaForDropTip
