"""Blow-out command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type, Union
from opentrons_shared_data.errors.exceptions import PipetteOverpressureError
from typing_extensions import Literal


from ..state.update_types import StateUpdate
from ..types import DeckPoint
from .pipetting_common import (
    OverpressureError,
    PipetteIdMixin,
    FlowRateMixin,
    WellLocationMixin,
    DestinationPositionResult,
)
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    DefinedErrorData,
    SuccessData,
)
from ..errors.error_occurrence import ErrorOccurrence

from opentrons.hardware_control import HardwareControlAPI


if TYPE_CHECKING:
    from ..execution import MovementHandler, PipettingHandler
    from ..state.state import StateView
    from ..resources import ModelUtils


BlowOutCommandType = Literal["blowout"]


class BlowOutParams(PipetteIdMixin, FlowRateMixin, WellLocationMixin):
    """Payload required to blow-out a specific well."""

    pass


class BlowOutResult(DestinationPositionResult):
    """Result data from the execution of a blow-out command."""

    pass


_ExecuteReturn = Union[
    SuccessData[BlowOutResult, None],
    DefinedErrorData[OverpressureError],
]


class BlowOutImplementation(AbstractCommandImpl[BlowOutParams, _ExecuteReturn]):
    """BlowOut command implementation."""

    def __init__(
        self,
        movement: MovementHandler,
        pipetting: PipettingHandler,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._movement = movement
        self._pipetting = pipetting
        self._state_view = state_view
        self._hardware_api = hardware_api
        self._model_utils = model_utils

    async def execute(self, params: BlowOutParams) -> _ExecuteReturn:
        """Move to and blow-out the requested well."""
        state_update = StateUpdate()

        x, y, z = await self._movement.move_to_well(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
        )
        deck_point = DeckPoint.construct(x=x, y=y, z=z)
        state_update.set_pipette_location(
            pipette_id=params.pipetteId,
            new_labware_id=params.labwareId,
            new_well_name=params.wellName,
            new_deck_point=deck_point,
        )
        try:
            await self._pipetting.blow_out_in_place(
                pipette_id=params.pipetteId, flow_rate=params.flowRate
            )
        except PipetteOverpressureError as e:
            return DefinedErrorData(
                public=OverpressureError(
                    id=self._model_utils.generate_id(),
                    createdAt=self._model_utils.get_timestamp(),
                    wrappedErrors=[
                        ErrorOccurrence.from_failed(
                            id=self._model_utils.generate_id(),
                            createdAt=self._model_utils.get_timestamp(),
                            error=e,
                        )
                    ],
                    errorInfo={
                        "retryLocation": (
                            x,
                            y,
                            z,
                        )
                    },
                ),
            )
        else:
            return SuccessData(
                public=BlowOutResult(position=deck_point),
                private=None,
                state_update=state_update,
            )


class BlowOut(BaseCommand[BlowOutParams, BlowOutResult, ErrorOccurrence]):
    """Blow-out command model."""

    commandType: BlowOutCommandType = "blowout"
    params: BlowOutParams
    result: Optional[BlowOutResult]

    _ImplementationCls: Type[BlowOutImplementation] = BlowOutImplementation


class BlowOutCreate(BaseCommandCreate[BlowOutParams]):
    """Create blow-out command request model."""

    commandType: BlowOutCommandType = "blowout"
    params: BlowOutParams

    _CommandCls: Type[BlowOut] = BlowOut
