"""Move to well command request, result, and implementation models."""
from __future__ import annotations
from pydantic import Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from ..types import DeckPoint, AddressableOffsetVector
from .pipetting_common import (
    PipetteIdMixin,
    MovementMixin,
    DestinationPositionResult,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import MovementHandler

MoveToAddressableAreaCommandType = Literal["moveToAddressableArea"]


class MoveToAddressableAreaParams(PipetteIdMixin, MovementMixin):
    """Payload required to move a pipette to a specific addressable area."""

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


class MoveToAddressableAreaResult(DestinationPositionResult):
    """Result data from the execution of a MoveToAddressableArea command."""

    pass


class MoveToAddressableAreaImplementation(
    AbstractCommandImpl[MoveToAddressableAreaParams, MoveToAddressableAreaResult]
):
    """Move to addressable area command implementation."""

    def __init__(self, movement: MovementHandler, **kwargs: object) -> None:
        self._movement = movement

    async def execute(
        self, params: MoveToAddressableAreaParams
    ) -> MoveToAddressableAreaResult:
        """Move the requested pipette to the requested addressable area."""
        x, y, z = await self._movement.move_to_addressable_area(
            pipette_id=params.pipetteId,
            addressable_area_name=params.addressableAreaName,
            offset=params.offset,
            force_direct=params.forceDirect,
            minimum_z_height=params.minimumZHeight,
            speed=params.speed,
        )

        return MoveToAddressableAreaResult(position=DeckPoint(x=x, y=y, z=z))


class MoveToAddressableArea(
    BaseCommand[MoveToAddressableAreaParams, MoveToAddressableAreaResult]
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
