"""Unseal tip from pipette command request, result, and implementation models."""

from __future__ import annotations

from pydantic import Field
from typing import TYPE_CHECKING, Optional, Type, Final
from typing_extensions import Literal

from opentrons.protocol_engine.resources.model_utils import ModelUtils

from ..types import DropTipWellLocation
from .pipetting_common import (
    PipetteIdMixin,
)
from .movement_common import (
    DestinationPositionResult,
    move_to_well,
    StallOrCollisionError,
)
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    DefinedErrorData,
    SuccessData,
)

if TYPE_CHECKING:
    from ..state.state import StateView
    from ..execution import MovementHandler, TipHandler, GantryMover


UnsealPipetteFromTipCommandType = Literal["unsealPipetteFromTip"]


class UnsealPipetteFromTipParams(PipetteIdMixin):
    """Payload required to drop a tip in a specific well."""

    labwareId: str = Field(..., description="Identifier of labware to use.")
    wellName: str = Field(..., description="Name of well to use in labware.")
    wellLocation: DropTipWellLocation = Field(
        default_factory=DropTipWellLocation,
        description="Relative well location at which to drop the tip.",
    )


class UnsealPipetteFromTipResult(DestinationPositionResult):
    """Result data from the execution of a DropTip command."""

    pass


_ExecuteReturn = (
    SuccessData[UnsealPipetteFromTipResult] | DefinedErrorData[StallOrCollisionError]
)

CUSTOM_TIP_LENGTH_MARGIN: Final = 10


class UnsealPipetteFromTipImplementation(
    AbstractCommandImpl[UnsealPipetteFromTipParams, _ExecuteReturn]
):
    """Drop tip command implementation."""

    def __init__(
        self,
        state_view: StateView,
        tip_handler: TipHandler,
        movement: MovementHandler,
        model_utils: ModelUtils,
        gantry_mover: GantryMover,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._tip_handler = tip_handler
        self._movement_handler = movement
        self._model_utils = model_utils
        self._gantry_mover = gantry_mover

    async def execute(self, params: UnsealPipetteFromTipParams) -> _ExecuteReturn:
        """Move to and drop a tip using the requested pipette."""
        pipette_id = params.pipetteId
        labware_id = params.labwareId
        well_name = params.wellName

        well_location = params.wellLocation

        tip_geometry = self._state_view.geometry.get_nominal_tip_geometry(
            pipette_id, labware_id, well_name
        )

        is_partially_configured = self._state_view.pipettes.get_is_partially_configured(
            pipette_id=pipette_id
        )
        tip_drop_location = self._state_view.geometry.get_checked_tip_drop_location(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_location=well_location,
            partially_configured=is_partially_configured,
            override_default_offset=-(tip_geometry.length - CUSTOM_TIP_LENGTH_MARGIN),
        )

        move_result = await move_to_well(
            movement=self._movement_handler,
            model_utils=self._model_utils,
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=tip_drop_location,
        )
        if isinstance(move_result, DefinedErrorData):
            return move_result

        await self._tip_handler.drop_tip(
            pipette_id=pipette_id,
            home_after=None,
            do_not_ignore_tip_presence=False,
            ignore_plunger=True,
        )

        return SuccessData(
            public=UnsealPipetteFromTipResult(position=move_result.public.position),
            state_update=move_result.state_update.set_fluid_unknown(
                pipette_id=pipette_id
            ).update_pipette_tip_state(
                pipette_id=params.pipetteId, tip_geometry=None, tip_source=None
            ),
        )


class UnsealPipetteFromTip(
    BaseCommand[
        UnsealPipetteFromTipParams, UnsealPipetteFromTipResult, StallOrCollisionError
    ]
):
    """Unseal pipette command model."""

    commandType: UnsealPipetteFromTipCommandType = "unsealPipetteFromTip"
    params: UnsealPipetteFromTipParams
    result: Optional[UnsealPipetteFromTipResult] = None

    _ImplementationCls: Type[
        UnsealPipetteFromTipImplementation
    ] = UnsealPipetteFromTipImplementation


class UnsealPipetteFromTipCreate(BaseCommandCreate[UnsealPipetteFromTipParams]):
    """Unseal pipette command creation request model."""

    commandType: UnsealPipetteFromTipCommandType = "unsealPipetteFromTip"
    params: UnsealPipetteFromTipParams

    _CommandCls: Type[UnsealPipetteFromTip] = UnsealPipetteFromTip
