"""Liquid-probe command for OT3 hardware. request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from pydantic import Field

from ..types import WellLocation, WellOrigin, CurrentWell, DeckPoint
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
        pipette_id = params.pipetteId
        labware_id = params.labwareId
        well_name = params.wellName

        ready_to_probe = self._pipetting.get_is_ready_to_aspirate(pipette_id=pipette_id)

        current_well = None

        if not ready_to_probe:
            await self._movement.move_to_well(
                pipette_id=pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=WellLocation(origin=WellOrigin.TOP),
            )

            current_well = CurrentWell(
                pipette_id=pipette_id,
                labware_id=labware_id,
                well_name=well_name,
            )

        position = await self._movement.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=params.wellLocation,
            current_well=current_well,
        )
        well_def = self._movement._state_store.labware.get_well_definition(
            labware_id, well_name
        )
        well_depth = well_def.depth
        z_pos = await self._pipetting.liquid_probe_in_place(
            pipette_id=pipette_id, max_z_dist=well_depth
        )

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
