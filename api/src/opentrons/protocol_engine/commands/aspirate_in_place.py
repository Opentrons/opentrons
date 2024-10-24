"""Aspirate in place command request, result, and implementation models."""

from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type, Union
from typing_extensions import Literal

from opentrons_shared_data.errors.exceptions import PipetteOverpressureError

from opentrons.hardware_control import HardwareControlAPI

from .pipetting_common import (
    PipetteIdMixin,
    AspirateVolumeMixin,
    FlowRateMixin,
    BaseLiquidHandlingResult,
    OverpressureError,
)
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
    DefinedErrorData,
)
from ..errors.error_occurrence import ErrorOccurrence
from ..errors.exceptions import PipetteNotReadyToAspirateError

if TYPE_CHECKING:
    from ..execution import PipettingHandler, GantryMover
    from ..resources import ModelUtils
    from ..state.state import StateView
    from ..notes import CommandNoteAdder

AspirateInPlaceCommandType = Literal["aspirateInPlace"]


class AspirateInPlaceParams(PipetteIdMixin, AspirateVolumeMixin, FlowRateMixin):
    """Payload required to aspirate in place."""

    pass


class AspirateInPlaceResult(BaseLiquidHandlingResult):
    """Result data from the execution of a AspirateInPlace command."""

    pass


_ExecuteReturn = Union[
    SuccessData[AspirateInPlaceResult, None],
    DefinedErrorData[OverpressureError],
]


class AspirateInPlaceImplementation(
    AbstractCommandImpl[AspirateInPlaceParams, _ExecuteReturn]
):
    """AspirateInPlace command implementation."""

    def __init__(
        self,
        pipetting: PipettingHandler,
        hardware_api: HardwareControlAPI,
        state_view: StateView,
        command_note_adder: CommandNoteAdder,
        model_utils: ModelUtils,
        gantry_mover: GantryMover,
        **kwargs: object,
    ) -> None:
        self._pipetting = pipetting
        self._state_view = state_view
        self._hardware_api = hardware_api
        self._command_note_adder = command_note_adder
        self._model_utils = model_utils
        self._gantry_mover = gantry_mover

    async def execute(self, params: AspirateInPlaceParams) -> _ExecuteReturn:
        """Aspirate without moving the pipette.

        Raises:
            TipNotAttachedError: if no tip is attached to the pipette.
            PipetteNotReadyToAspirateError: pipette plunger is not ready.
        """
        ready_to_aspirate = self._pipetting.get_is_ready_to_aspirate(
            pipette_id=params.pipetteId,
        )

        if not ready_to_aspirate:
            raise PipetteNotReadyToAspirateError(
                "Pipette cannot aspirate in place because of a previous blow out."
                " The first aspirate following a blow-out must be from a specific well"
                " so the plunger can be reset in a known safe position."
            )
        try:
            current_position = await self._gantry_mover.get_position(params.pipetteId)
            volume = await self._pipetting.aspirate_in_place(
                pipette_id=params.pipetteId,
                volume=params.volume,
                flow_rate=params.flowRate,
                command_note_adder=self._command_note_adder,
            )
        except PipetteOverpressureError as e:
            # TODO(pbm, 10-24-24): if location is a well, get new tip and LiquidProbe in error recovery to reestablish well liquid level
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
                    errorInfo=(
                        {
                            "retryLocation": (
                                current_position.x,
                                current_position.y,
                                current_position.z,
                            )
                        }
                    ),
                ),
            )
        else:
            # if location is a well, update WellStore
            return SuccessData(
                public=AspirateInPlaceResult(volume=volume), private=None
            )


class AspirateInPlace(
    BaseCommand[AspirateInPlaceParams, AspirateInPlaceResult, OverpressureError]
):
    """AspirateInPlace command model."""

    commandType: AspirateInPlaceCommandType = "aspirateInPlace"
    params: AspirateInPlaceParams
    result: Optional[AspirateInPlaceResult]

    _ImplementationCls: Type[
        AspirateInPlaceImplementation
    ] = AspirateInPlaceImplementation


class AspirateInPlaceCreate(BaseCommandCreate[AspirateInPlaceParams]):
    """AspirateInPlace command request model."""

    commandType: AspirateInPlaceCommandType = "aspirateInPlace"
    params: AspirateInPlaceParams

    _CommandCls: Type[AspirateInPlace] = AspirateInPlace
