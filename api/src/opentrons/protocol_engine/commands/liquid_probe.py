"""The liquidProbe and tryLiquidProbe commands."""

from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Tuple, Type, Union
from opentrons.protocol_engine.errors.exceptions import MustHomeError, TipNotEmptyError
from opentrons.protocol_engine.state import update_types
from opentrons.types import MountType
from opentrons_shared_data.errors.exceptions import (
    PipetteLiquidNotFoundError,
)
from typing_extensions import Literal

from pydantic import Field

from ..types import DeckPoint
from .pipetting_common import (
    LiquidNotFoundError,
    PipetteIdMixin,
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

if TYPE_CHECKING:
    from ..execution import MovementHandler, PipettingHandler
    from ..resources import ModelUtils


LiquidProbeCommandType = Literal["liquidProbe"]
TryLiquidProbeCommandType = Literal["tryLiquidProbe"]


# Both command variants should have identical parameters.
# But we need two separate parameter model classes because
# `command_unions.CREATE_TYPES_BY_PARAMS_TYPE` needs to be a 1:1 mapping.
class _CommonParams(PipetteIdMixin, WellLocationMixin):
    pass


class LiquidProbeParams(_CommonParams):
    """Parameters required for a `liquidProbe` command."""

    pass


class TryLiquidProbeParams(_CommonParams):
    """Parameters required for a `tryLiquidProbe` command."""

    pass


class LiquidProbeResult(DestinationPositionResult):
    """Result data from the execution of a `liquidProbe` command."""

    z_position: float = Field(
        ..., description="The Z coordinate, in mm, of the found liquid in deck space."
    )
    # New fields should use camelCase. z_position is snake_case for historical reasons.


class TryLiquidProbeResult(DestinationPositionResult):
    """Result data from the execution of a `tryLiquidProbe` command."""

    z_position: Optional[float] = Field(
        ...,
        description=(
            "The Z coordinate, in mm, of the found liquid in deck space."
            " If no liquid was found, `null` or omitted."
        ),
    )


_LiquidProbeExecuteReturn = Union[
    SuccessData[LiquidProbeResult, None],
    DefinedErrorData[LiquidNotFoundError, None],
]
_TryLiquidProbeExecuteReturn = SuccessData[TryLiquidProbeResult, None]


async def _execute_common(
    movement: MovementHandler, pipetting: PipettingHandler, params: _CommonParams
) -> Tuple[float | PipetteLiquidNotFoundError, update_types.StateUpdate, DeckPoint]:
    pipette_id = params.pipetteId
    labware_id = params.labwareId
    well_name = params.wellName

    state_update = update_types.StateUpdate()

    # _validate_tip_attached in pipetting.py is a private method so we're using
    # get_is_ready_to_aspirate as an indirect way to throw a TipNotAttachedError if appropriate
    pipetting.get_is_ready_to_aspirate(pipette_id=pipette_id)

    if pipetting.get_is_empty(pipette_id=pipette_id) is False:
        raise TipNotEmptyError(
            message="This operation requires a tip with no liquid in it."
        )

    if await movement.check_for_valid_position(mount=MountType.LEFT) is False:
        raise MustHomeError(
            message="Current position of pipette is invalid. Please home."
        )

    # liquid_probe process start position
    position = await movement.move_to_well(
        pipette_id=pipette_id,
        labware_id=labware_id,
        well_name=well_name,
        well_location=params.wellLocation,
    )
    deck_point = DeckPoint.construct(x=position.x, y=position.y, z=position.z)
    state_update.set_pipette_location(
        pipette_id=pipette_id,
        new_labware_id=labware_id,
        new_well_name=well_name,
        new_deck_point=deck_point,
    )

    try:
        z_pos = await pipetting.liquid_probe_in_place(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=params.wellLocation,
        )
    except PipetteLiquidNotFoundError as e:
        return e, state_update, deck_point
    else:
        return z_pos, state_update, deck_point


class LiquidProbeImplementation(
    AbstractCommandImpl[LiquidProbeParams, _LiquidProbeExecuteReturn]
):
    """The implementation of a `liquidProbe` command."""

    def __init__(
        self,
        movement: MovementHandler,
        pipetting: PipettingHandler,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._movement = movement
        self._pipetting = pipetting
        self._model_utils = model_utils

    async def execute(self, params: _CommonParams) -> _LiquidProbeExecuteReturn:
        """Move to and liquid probe the requested well.

        Return the z-position of the found liquid.
        If no liquid is found, return a LiquidNotFoundError as a defined error.

        Raises:
            TipNotAttachedError: as an undefined error, if there is not tip attached to
                the pipette.
            TipNotEmptyError: as an undefined error, if the tip starts with liquid
                in it.
            MustHomeError: as an undefined error, if the plunger is not in a valid
                position.
        """
        z_pos_or_error, state_update, deck_point = await _execute_common(
            self._movement, self._pipetting, params
        )
        if isinstance(z_pos_or_error, PipetteLiquidNotFoundError):
            return DefinedErrorData(
                public=LiquidNotFoundError(
                    id=self._model_utils.generate_id(),
                    createdAt=self._model_utils.get_timestamp(),
                    wrappedErrors=[
                        ErrorOccurrence.from_failed(
                            id=self._model_utils.generate_id(),
                            createdAt=self._model_utils.get_timestamp(),
                            error=z_pos_or_error,
                        )
                    ],
                ),
                private=None,
                state_update=state_update,
            )
        else:
            return SuccessData(
                public=LiquidProbeResult(
                    z_position=z_pos_or_error, position=deck_point
                ),
                private=None,
                state_update=state_update,
            )


class TryLiquidProbeImplementation(
    AbstractCommandImpl[TryLiquidProbeParams, _TryLiquidProbeExecuteReturn]
):
    """The implementation of a `tryLiquidProbe` command."""

    def __init__(
        self,
        movement: MovementHandler,
        pipetting: PipettingHandler,
        **kwargs: object,
    ) -> None:
        self._movement = movement
        self._pipetting = pipetting

    async def execute(self, params: _CommonParams) -> _TryLiquidProbeExecuteReturn:
        """Execute a `tryLiquidProbe` command.

        `tryLiquidProbe` is identical to `liquidProbe`, except that if no liquid is
        found, `tryLiquidProbe` returns a success result with `z_position=null` instead
        of a defined error.
        """
        z_pos_or_error, state_update, deck_point = await _execute_common(
            self._movement, self._pipetting, params
        )

        z_pos = (
            None
            if isinstance(z_pos_or_error, PipetteLiquidNotFoundError)
            else z_pos_or_error
        )
        return SuccessData(
            public=TryLiquidProbeResult(
                z_position=z_pos,
                position=deck_point,
            ),
            private=None,
            state_update=state_update,
        )


class LiquidProbe(
    BaseCommand[LiquidProbeParams, LiquidProbeResult, LiquidNotFoundError]
):
    """The model for a full `liquidProbe` command."""

    commandType: LiquidProbeCommandType = "liquidProbe"
    params: LiquidProbeParams
    result: Optional[LiquidProbeResult]

    _ImplementationCls: Type[LiquidProbeImplementation] = LiquidProbeImplementation


class TryLiquidProbe(
    BaseCommand[TryLiquidProbeParams, TryLiquidProbeResult, ErrorOccurrence]
):
    """The model for a full `tryLiquidProbe` command."""

    commandType: TryLiquidProbeCommandType = "tryLiquidProbe"
    params: TryLiquidProbeParams
    result: Optional[TryLiquidProbeResult]

    _ImplementationCls: Type[
        TryLiquidProbeImplementation
    ] = TryLiquidProbeImplementation


class LiquidProbeCreate(BaseCommandCreate[LiquidProbeParams]):
    """The request model for a `liquidProbe` command."""

    commandType: LiquidProbeCommandType = "liquidProbe"
    params: LiquidProbeParams

    _CommandCls: Type[LiquidProbe] = LiquidProbe


class TryLiquidProbeCreate(BaseCommandCreate[TryLiquidProbeParams]):
    """The request model for a `tryLiquidProbe` command."""

    commandType: TryLiquidProbeCommandType = "tryLiquidProbe"
    params: TryLiquidProbeParams

    _CommandCls: Type[TryLiquidProbe] = TryLiquidProbe
