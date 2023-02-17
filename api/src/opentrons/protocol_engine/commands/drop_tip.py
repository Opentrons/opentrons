"""Drop tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from ..types import DropTipWellLocation
from .pipetting_common import PipetteIdMixin, DestinationPositionResult
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import PipettingHandler


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


class DropTipResult(DestinationPositionResult):
    """Result data from the execution of a DropTip command."""

    pass


class DropTipImplementation(AbstractCommandImpl[DropTipParams, DropTipResult]):
    """Drop tip command implementation."""

    def __init__(self, pipetting: PipettingHandler, **kwargs: object) -> None:
        self._pipetting = pipetting

    async def execute(self, params: DropTipParams) -> DropTipResult:
        """Move to and drop a tip using the requested pipette."""
        position = await self._pipetting.drop_tip(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
            home_after=params.homeAfter,
        )

        return DropTipResult(position=position)


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
