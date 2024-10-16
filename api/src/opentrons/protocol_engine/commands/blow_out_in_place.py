"""Blow-out in place command request, result, and implementation models."""

from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type, Union
from opentrons_shared_data.errors.exceptions import PipetteOverpressureError
from typing_extensions import Literal
from pydantic import BaseModel

from .pipetting_common import (
    OverpressureError,
    PipetteIdMixin,
    FlowRateMixin,
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
    from ..execution import PipettingHandler, GantryMover
    from ..state.state import StateView
    from ..resources import ModelUtils


BlowOutInPlaceCommandType = Literal["blowOutInPlace"]


class BlowOutInPlaceParams(PipetteIdMixin, FlowRateMixin):
    """Payload required to blow-out in place."""

    pass


class BlowOutInPlaceResult(BaseModel):
    """Result data from the execution of a BlowOutInPlace command."""

    pass


_ExecuteReturn = Union[
    SuccessData[BlowOutInPlaceResult, None],
    DefinedErrorData[OverpressureError],
]


class BlowOutInPlaceImplementation(
    AbstractCommandImpl[BlowOutInPlaceParams, _ExecuteReturn]
):
    """BlowOutInPlace command implementation."""

    def __init__(
        self,
        pipetting: PipettingHandler,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        model_utils: ModelUtils,
        gantry_mover: GantryMover,
        **kwargs: object,
    ) -> None:
        self._pipetting = pipetting
        self._state_view = state_view
        self._hardware_api = hardware_api
        self._model_utils = model_utils
        self._gantry_mover = gantry_mover

    async def execute(self, params: BlowOutInPlaceParams) -> _ExecuteReturn:
        """Blow-out without moving the pipette."""
        try:
            await self._pipetting.blow_out_in_place(
                pipette_id=params.pipetteId, flow_rate=params.flowRate
            )
        except PipetteOverpressureError as e:
            current_position = await self._gantry_mover.get_position(params.pipetteId)
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
                            current_position.x,
                            current_position.y,
                            current_position.z,
                        )
                    },
                ),
            )
        else:
            return SuccessData(public=BlowOutInPlaceResult(), private=None)


class BlowOutInPlace(
    BaseCommand[BlowOutInPlaceParams, BlowOutInPlaceResult, ErrorOccurrence]
):
    """BlowOutInPlace command model."""

    commandType: BlowOutInPlaceCommandType = "blowOutInPlace"
    params: BlowOutInPlaceParams
    result: Optional[BlowOutInPlaceResult]

    _ImplementationCls: Type[
        BlowOutInPlaceImplementation
    ] = BlowOutInPlaceImplementation


class BlowOutInPlaceCreate(BaseCommandCreate[BlowOutInPlaceParams]):
    """BlowOutInPlace command request model."""

    commandType: BlowOutInPlaceCommandType = "blowOutInPlace"
    params: BlowOutInPlaceParams

    _CommandCls: Type[BlowOutInPlace] = BlowOutInPlace
