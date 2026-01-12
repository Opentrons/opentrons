"""Aspirate command request, result, and implementation models."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional, Type, Union

from typing_extensions import Literal

from ..errors.exceptions import PipetteNotReadyToAspirateError
from ..state.update_types import CLEAR, StateUpdate
from ..types import DeckPoint
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    DefinedErrorData,
    SuccessData,
)
from .movement_common import (
    DestinationPositionResult,
    DynamicLiquidHandlingWellLocationMixin,
    StallOrCollisionError,
    move_to_well,
)
from .pipetting_common import (
    AspirateVolumeMixin,
    BaseLiquidHandlingResult,
    FlowRateMixin,
    OverpressureError,
    PipetteIdMixin,
    aspirate_while_tracking,
)
from opentrons.hardware_control import HardwareControlAPI

if TYPE_CHECKING:
    from ..execution import GantryMover, MovementHandler, PipettingHandler
    from ..notes import CommandNoteAdder
    from ..resources import ModelUtils
    from ..state.state import StateView


AspirateWhileTrackingCommandType = Literal["aspirateWhileTracking"]


class AspirateWhileTrackingParams(
    PipetteIdMixin,
    AspirateVolumeMixin,
    FlowRateMixin,
    DynamicLiquidHandlingWellLocationMixin,
):
    """Parameters required to aspirate from a specific well."""

    pass


class AspirateWhileTrackingResult(BaseLiquidHandlingResult, DestinationPositionResult):
    """Result data from execution of an Aspirate command."""

    pass


_ExecuteReturn = Union[
    SuccessData[AspirateWhileTrackingResult],
    DefinedErrorData[OverpressureError] | DefinedErrorData[StallOrCollisionError],
]


class AspirateWhileTrackingImplementation(
    AbstractCommandImpl[AspirateWhileTrackingParams, _ExecuteReturn]
):
    """AspirateWhileTracking command implementation."""

    def __init__(
        self,
        pipetting: PipettingHandler,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        command_note_adder: CommandNoteAdder,
        model_utils: ModelUtils,
        gantry_mover: GantryMover,
        movement: MovementHandler,
        **kwargs: object,
    ) -> None:
        self._pipetting = pipetting
        self._state_view = state_view
        self._hardware_api = hardware_api
        self._command_note_adder = command_note_adder
        self._model_utils = model_utils
        self._gantry_mover = gantry_mover
        self._movement = movement

    async def execute(self, params: AspirateWhileTrackingParams) -> _ExecuteReturn:
        """Move to and aspirate from the requested well.

        Raises:
            TipNotAttachedError: if no tip is attached to the pipette.
            PipetteNotReadyToAspirateError: pipette plunger is not ready.
        """
        ready_to_aspirate = self._state_view.pipettes.get_ready_to_aspirate(
            pipette_id=params.pipetteId
        )
        if not ready_to_aspirate:
            raise PipetteNotReadyToAspirateError(
                "Pipette cannot aspirate while tracking because a previous dispense or"
                " blowout pushed the plunger beyond the bottom position."
                " The subsequent aspirate must be from a specific well so the plunger"
                " can be reset in a known safe position."
            )
        state_update = StateUpdate()

        end_point = self._state_view.geometry.get_well_position(
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.trackToLocation,
            operation_volume=-params.volume,
            pipette_id=params.pipetteId,
        )
        move_result = await move_to_well(
            movement=self._movement,
            model_utils=self._model_utils,
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.trackFromLocation,
        )
        state_update.append(move_result.state_update)
        if isinstance(move_result, DefinedErrorData):
            return DefinedErrorData(
                public=move_result.public, state_update=state_update
            )

        aspirate_result = await aspirate_while_tracking(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            volume=params.volume,
            flow_rate=params.flowRate,
            end_point=end_point,
            location_if_error={
                "retryLocation": (
                    move_result.public.position.x,
                    move_result.public.position.y,
                    move_result.public.position.z,
                )
            },
            command_note_adder=self._command_note_adder,
            pipetting=self._pipetting,
            model_utils=self._model_utils,
            movement_delay=params.movement_delay,
        )
        state_update.append(aspirate_result.state_update)
        if isinstance(aspirate_result, DefinedErrorData):
            state_update.set_liquid_operated(
                labware_id=params.labwareId,
                well_names=self._state_view.geometry.get_wells_covered_by_pipette_with_active_well(
                    params.labwareId,
                    params.wellName,
                    params.pipetteId,
                ),
                volume_added=CLEAR,
            )
            if isinstance(aspirate_result.public, OverpressureError):
                return DefinedErrorData(
                    public=OverpressureError(
                        id=aspirate_result.public.id,
                        createdAt=aspirate_result.public.createdAt,
                        wrappedErrors=aspirate_result.public.wrappedErrors,
                        errorInfo=aspirate_result.public.errorInfo,
                    ),
                    state_update=state_update,
                    state_update_if_false_positive=aspirate_result.state_update_if_false_positive,
                )
            elif isinstance(aspirate_result.public, StallOrCollisionError):
                return DefinedErrorData(
                    public=StallOrCollisionError(
                        id=aspirate_result.public.id,
                        createdAt=aspirate_result.public.createdAt,
                        wrappedErrors=aspirate_result.public.wrappedErrors,
                        errorInfo=aspirate_result.public.errorInfo,
                    ),
                    state_update=state_update,
                    state_update_if_false_positive=aspirate_result.state_update_if_false_positive,
                )

        position_after_aspirate = await self._gantry_mover.get_position(
            params.pipetteId
        )
        result_deck_point = DeckPoint.model_construct(
            x=position_after_aspirate.x,
            y=position_after_aspirate.y,
            z=position_after_aspirate.z,
        )
        return SuccessData(
            public=AspirateWhileTrackingResult(
                volume=aspirate_result.public.volume,
                position=result_deck_point,
            ),
            state_update=state_update.set_liquid_operated(
                labware_id=params.labwareId,
                well_names=self._state_view.geometry.get_wells_covered_by_pipette_with_active_well(
                    params.labwareId,
                    params.wellName,
                    params.pipetteId,
                ),
                volume_added=-aspirate_result.public.volume
                * self._state_view.geometry.get_nozzles_per_well(
                    params.labwareId,
                    params.wellName,
                    params.pipetteId,
                ),
            ),
        )


class AspirateWhileTracking(
    BaseCommand[
        AspirateWhileTrackingParams,
        AspirateWhileTrackingResult,
        OverpressureError | StallOrCollisionError,
    ]
):
    """AspirateWhileTracking command model."""

    commandType: AspirateWhileTrackingCommandType = "aspirateWhileTracking"
    params: AspirateWhileTrackingParams
    result: Optional[AspirateWhileTrackingResult] = None

    _ImplementationCls: Type[AspirateWhileTrackingImplementation] = (
        AspirateWhileTrackingImplementation
    )


class AspirateWhileTrackingCreate(BaseCommandCreate[AspirateWhileTrackingParams]):
    """Create aspirateWhileTracking command request model."""

    commandType: AspirateWhileTrackingCommandType = "aspirateWhileTracking"
    params: AspirateWhileTrackingParams

    _CommandCls: Type[AspirateWhileTracking] = AspirateWhileTracking
