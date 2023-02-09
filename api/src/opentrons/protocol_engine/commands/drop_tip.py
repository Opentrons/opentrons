"""Drop tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from ..types import WellLocation, WellOrigin, WellOffset
from .pipetting_common import PipetteIdMixin, WellLocationMixin
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import PipettingHandler


DropTipCommandType = Literal["dropTip"]


class DropTipWellLocation(WellLocation):
    """A relative location in reference to a tip rack's well's location."""

    origin: WellOrigin = WellOrigin.DROP_TIP
    offset: WellOffset = Field(default_factory=WellOffset)


class DropTipParams(PipetteIdMixin, WellLocationMixin):
    """Payload required to drop a tip in a specific well."""

    wellLocation: DropTipWellLocation = Field(
        default_factory=DropTipWellLocation,
        description="Relative well location at which to drop the tip.",
    )


class DropTipResult(BaseModel):
    """Result data from the execution of a DropTip command."""

    pass


class DropTipImplementation(AbstractCommandImpl[DropTipParams, DropTipResult]):
    """Drop tip command implementation."""

    def __init__(self, pipetting: PipettingHandler, **kwargs: object) -> None:
        self._pipetting = pipetting

    async def execute(self, params: DropTipParams) -> DropTipResult:
        """Move to and drop a tip using the requested pipette."""
        await self._pipetting.drop_tip(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
        )

        return DropTipResult()


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
