"""Liquid-probe command for OT3 hardware. request, result, and implementation models."""
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal
from pydantic import Field

from ..types import DeckPoint
from .pipetting_common import (
    PipetteIdMixin,
    WellLocationMixin,
    DestinationPositionResult,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from ..execution import MovementHandler, PipettingHandler


LiquidProbeCommandType = Literal["liquidProbe"]


class LiquidProbeParams(PipetteIdMixin, WellLocationMixin):
    """Payload required to liquid probe."""

    pass


class LiquidProbeResult(DestinationPositionResult):
    """Result data from the execution of a liquid-probe command."""

    z_position: float = Field(..., description="Z position of the found liquid.")


class LiquidProbeImplementation(
    AbstractCommandImpl[LiquidProbeParams, SuccessData[LiquidProbeResult, None]]
):
    """The implementation of a `liquidProbe` command."""

    def __init__(
        self, movement: MovementHandler, pipetting: PipettingHandler, **kwargs: object
    ) -> None:
        self._movement = movement
        self._pipetting = pipetting

    async def execute(
        self, params: LiquidProbeParams
    ) -> SuccessData[LiquidProbeResult, None]:
        """Execute a `liquidProbe` command.

        Return the z-position of the found liquid.
        """
        # LiquidNotFoundError exception raised in ot3controller
        # account for labware (height)?
        # make liquid_probe_in_place command

        position = await self._movement.move_to_well(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
        )
        z_pos = await self._pipetting.liquid_probe_in_place(
            pipette_id=params.pipetteId
        )  # pass probe (settings)?

        return SuccessData(
            public=LiquidProbeResult(
                z_position=z_pos,
                position=DeckPoint(x=position.x, y=position.y, z=position.z),
            ),
            private=None,
        )


class LiquidProbe(BaseCommand[LiquidProbeParams, LiquidProbeResult, ErrorOccurrence]):
    """A `liquidProbe` command."""

    commandType: LiquidProbeCommandType = "liquidProbe"
    params: LiquidProbeParams
    result: Optional[LiquidProbeResult]

    _ImplementationCls: Type[LiquidProbeImplementation] = LiquidProbeImplementation


class LiquidProbeCreate(BaseCommandCreate[LiquidProbeParams]):
    """A request to create a `liquidProbe` command."""

    commandType: LiquidProbeCommandType = "liquidProbe"
    params: LiquidProbeParams

    _CommandCls: Type[LiquidProbe] = LiquidProbe
