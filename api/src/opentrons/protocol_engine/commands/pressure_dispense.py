"""Pressure Dispense-in-place command request, result, and implementation models."""

from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type, Union
from typing_extensions import Literal

from .pipetting_common import (
    PipetteIdMixin,
    FlowRateMixin,
    DispenseVolumeMixin,
    BaseLiquidHandlingResult,
    dispense_in_place,
    increase_evo_disp_count,
    DEFAULT_CORRECTION_VOLUME,
)
from .movement_common import (
    LiquidHandlingWellLocationMixin,
    StallOrCollisionError,
    move_to_well,
)

from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
    DefinedErrorData,
)
from ..state.update_types import StateUpdate
from ..errors import ProtocolEngineError

if TYPE_CHECKING:
    from ..execution import PipettingHandler, GantryMover, MovementHandler
    from ..resources import ModelUtils
    from ..state.state import StateView


PressureDispenseCommandType = Literal["pressureDispense"]


class PressureDispenseParams(
    PipetteIdMixin, DispenseVolumeMixin, FlowRateMixin, LiquidHandlingWellLocationMixin
):
    """Payload required to pressure dispense in place."""

    pass


class PressureDispenseResult(BaseLiquidHandlingResult):
    """Result data from the execution of a PressureDispense command."""

    pass


_ExecuteReturn = Union[
    SuccessData[PressureDispenseResult],
    DefinedErrorData[StallOrCollisionError],
]


class PressureDispenseImplementation(
    AbstractCommandImpl[PressureDispenseParams, _ExecuteReturn]
):
    """Pressure dispense command implementation."""

    def __init__(
        self,
        pipetting: PipettingHandler,
        state_view: StateView,
        gantry_mover: GantryMover,
        model_utils: ModelUtils,
        movement: MovementHandler,
        **kwargs: object,
    ) -> None:
        self._pipetting = pipetting
        self._state_view = state_view
        self._gantry_mover = gantry_mover
        self._model_utils = model_utils
        self._movement = movement

    async def execute(self, params: PressureDispenseParams) -> _ExecuteReturn:
        """Move to and pressure dispense to the requested well."""
        well_location = params.wellLocation
        labware_id = params.labwareId
        well_name = params.wellName

        move_result = await move_to_well(
            movement=self._movement,
            model_utils=self._model_utils,
            pipette_id=params.pipetteId,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )
        if isinstance(move_result, DefinedErrorData):
            return move_result

        current_position = await self._gantry_mover.get_position(params.pipetteId)
        await increase_evo_disp_count(
            pipette_id=params.pipetteId, pipetting=self._pipetting
        )
        result = await dispense_in_place(
            pipette_id=params.pipetteId,
            volume=params.volume,
            flow_rate=params.flowRate,
            push_out=None,
            location_if_error={
                "retryLocation": (
                    current_position.x,
                    current_position.y,
                    current_position.z,
                )
            },
            pipetting=self._pipetting,
            model_utils=self._model_utils,
            correction_volume=params.correctionVolume or DEFAULT_CORRECTION_VOLUME,
        )
        if isinstance(result, DefinedErrorData):
            # TODO (chb, 2025-01-29): Remove this and the OverpressureError returns once disabled for this function
            raise ProtocolEngineError(
                message="Overpressure Error during Resin Tip Dispense Command."
            )
        return SuccessData(
            public=PressureDispenseResult(volume=result.public.volume),
            state_update=StateUpdate.reduce(
                move_result.state_update, result.state_update
            ),
        )


class PressureDispense(
    BaseCommand[
        PressureDispenseParams,
        PressureDispenseResult,
        StallOrCollisionError,
    ]
):
    """PressureDispense command model."""

    commandType: PressureDispenseCommandType = "pressureDispense"
    params: PressureDispenseParams
    result: Optional[PressureDispenseResult] = None

    _ImplementationCls: Type[
        PressureDispenseImplementation
    ] = PressureDispenseImplementation


class PressureDispenseCreate(BaseCommandCreate[PressureDispenseParams]):
    """PressureDispense command request model."""

    commandType: PressureDispenseCommandType = "pressureDispense"
    params: PressureDispenseParams

    _CommandCls: Type[PressureDispense] = PressureDispense
