"""Aspirate command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type, Union
from opentrons_shared_data.errors.exceptions import PipetteOverpressureError
from typing_extensions import Literal

from .pipetting_common import (
    OverpressureError,
    OverpressureErrorInternalData,
    PipetteIdMixin,
    AspirateVolumeMixin,
    FlowRateMixin,
    WellLocationMixin,
    BaseLiquidHandlingResult,
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

from ..types import WellLocation, WellOrigin, CurrentWell, DeckPoint

if TYPE_CHECKING:
    from ..execution import MovementHandler, PipettingHandler
    from ..resources import ModelUtils
    from ..state import StateView
    from ..notes import CommandNoteAdder


AspirateCommandType = Literal["aspirate"]


class AspirateParams(
    PipetteIdMixin, AspirateVolumeMixin, FlowRateMixin, WellLocationMixin
):
    """Parameters required to aspirate from a specific well."""

    pass


class AspirateResult(BaseLiquidHandlingResult, DestinationPositionResult):
    """Result data from execution of an Aspirate command."""

    pass


_ExecuteReturn = Union[
    SuccessData[AspirateResult, None],
    DefinedErrorData[OverpressureError, OverpressureErrorInternalData],
]


class AspirateImplementation(AbstractCommandImpl[AspirateParams, _ExecuteReturn]):
    """Aspirate command implementation."""

    def __init__(
        self,
        pipetting: PipettingHandler,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        movement: MovementHandler,
        command_note_adder: CommandNoteAdder,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._pipetting = pipetting
        self._state_view = state_view
        self._hardware_api = hardware_api
        self._movement = movement
        self._command_note_adder = command_note_adder
        self._model_utils = model_utils

    async def execute(self, params: AspirateParams) -> _ExecuteReturn:
        """Move to and aspirate from the requested well.

        Raises:
            TipNotAttachedError: if no tip is attached to the pipette.
        """
        pipette_id = params.pipetteId
        labware_id = params.labwareId
        well_name = params.wellName

        ready_to_aspirate = self._pipetting.get_is_ready_to_aspirate(
            pipette_id=pipette_id
        )

        current_well = None

        if not ready_to_aspirate:
            await self._movement.move_to_well(
                pipette_id=pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=WellLocation(origin=WellOrigin.TOP),
            )

            await self._pipetting.prepare_for_aspirate(pipette_id=pipette_id)

            # set our current deck location to the well now that we've made
            # an intermediate move for the "prepare for aspirate" step
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

        try:
            volume_aspirated = await self._pipetting.aspirate_in_place(
                pipette_id=pipette_id,
                volume=params.volume,
                flow_rate=params.flowRate,
                command_note_adder=self._command_note_adder,
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
                    errorInfo={"retryLocation": (position.x, position.y, position.z)},
                ),
                private=OverpressureErrorInternalData(
                    position=DeckPoint.construct(
                        x=position.x, y=position.y, z=position.z
                    )
                ),
            )
        else:
            return SuccessData(
                public=AspirateResult(
                    volume=volume_aspirated,
                    position=DeckPoint.construct(
                        x=position.x, y=position.y, z=position.z
                    ),
                ),
                private=None,
            )


class Aspirate(BaseCommand[AspirateParams, AspirateResult, ErrorOccurrence]):
    """Aspirate command model."""

    commandType: AspirateCommandType = "aspirate"
    params: AspirateParams
    result: Optional[AspirateResult]

    _ImplementationCls: Type[AspirateImplementation] = AspirateImplementation


class AspirateCreate(BaseCommandCreate[AspirateParams]):
    """Create aspirate command request model."""

    commandType: AspirateCommandType = "aspirate"
    params: AspirateParams

    _CommandCls: Type[Aspirate] = Aspirate
