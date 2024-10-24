"""The liquidProbe and tryLiquidProbe commands."""

from __future__ import annotations
from typing import TYPE_CHECKING, NamedTuple, Optional, Type, Union
from typing_extensions import Literal

from pydantic import Field

from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.errors.exceptions import (
    MustHomeError,
    PipetteNotReadyToAspirateError,
    TipNotEmptyError,
    IncompleteLabwareDefinitionError,
)
from opentrons.types import MountType
from opentrons_shared_data.errors.exceptions import (
    PipetteLiquidNotFoundError,
)

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
    from ..state.state import StateView


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
    DefinedErrorData[LiquidNotFoundError],
]
_TryLiquidProbeExecuteReturn = SuccessData[TryLiquidProbeResult, None]


class _ExecuteCommonResult(NamedTuple):
    # If the probe succeeded, the z_pos that it returned.
    # Or, if the probe found no liquid, the error representing that,
    # so calling code can propagate those details up.
    z_pos_or_error: float | PipetteLiquidNotFoundError

    state_update: update_types.StateUpdate
    deck_point: DeckPoint


async def _execute_common(
    state_view: StateView,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    params: _CommonParams,
) -> _ExecuteCommonResult:
    pipette_id = params.pipetteId
    labware_id = params.labwareId
    well_name = params.wellName

    state_update = update_types.StateUpdate()

    # May raise TipNotAttachedError.
    aspirated_volume = state_view.pipettes.get_aspirated_volume(pipette_id)

    if aspirated_volume is None:
        # Theoretically, we could avoid raising an error by automatically preparing
        # to aspirate above the well like AspirateImplementation does. However, the
        # only way for this to happen is if someone tries to do a liquid probe with
        # a tip that's previously held liquid, which they should avoid anyway.
        raise PipetteNotReadyToAspirateError(
            "The pipette cannot probe liquid because of a previous blow out."
            " The plunger must be reset while the tip is somewhere away from liquid."
        )
    elif aspirated_volume != 0:
        raise TipNotEmptyError(
            message="The pipette cannot probe for liquid when the tip has liquid in it."
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
    except PipetteLiquidNotFoundError as exception:
        return _ExecuteCommonResult(
            z_pos_or_error=exception, state_update=state_update, deck_point=deck_point
        )
    else:
        return _ExecuteCommonResult(
            z_pos_or_error=z_pos, state_update=state_update, deck_point=deck_point
        )


class LiquidProbeImplementation(
    AbstractCommandImpl[LiquidProbeParams, _LiquidProbeExecuteReturn]
):
    """The implementation of a `liquidProbe` command."""

    def __init__(
        self,
        state_view: StateView,
        movement: MovementHandler,
        pipetting: PipettingHandler,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
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
            PipetteNotReadyToAspirateError: as an undefined error, if the plunger is not
                in a safe position to do the liquid probe.
            MustHomeError: as an undefined error, if the plunger is not in a valid
                position.
        """
        z_pos_or_error, state_update, deck_point = await _execute_common(
            self._state_view, self._movement, self._pipetting, params
        )
        if isinstance(z_pos_or_error, PipetteLiquidNotFoundError):
            state_update.set_liquid_probed(
                labware_id=params.labwareId,
                well_name=params.wellName,
                height=None,
                volume=None,
                last_probed=self._model_utils.get_timestamp(),
            )
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
                state_update=state_update,
            )
        else:
            try:
                well_volume = self._state_view.geometry.get_well_volume_at_height(
                    labware_id=params.labwareId,
                    well_name=params.wellName,
                    height=z_pos_or_error,
                )
            except IncompleteLabwareDefinitionError:
                well_volume = None
            state_update.set_liquid_probed(
                labware_id=params.labwareId,
                well_name=params.wellName,
                height=z_pos_or_error,
                volume=well_volume,
                last_probed=self._model_utils.get_timestamp(),
            )
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
        state_view: StateView,
        movement: MovementHandler,
        pipetting: PipettingHandler,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._movement = movement
        self._pipetting = pipetting
        self._model_utils = model_utils

    async def execute(self, params: _CommonParams) -> _TryLiquidProbeExecuteReturn:
        """Execute a `tryLiquidProbe` command.

        `tryLiquidProbe` is identical to `liquidProbe`, except that if no liquid is
        found, `tryLiquidProbe` returns a success result with `z_position=null` instead
        of a defined error.
        """
        z_pos_or_error, state_update, deck_point = await _execute_common(
            self._state_view, self._movement, self._pipetting, params
        )

        if isinstance(z_pos_or_error, PipetteLiquidNotFoundError):
            z_pos = None
            well_volume = None
        else:
            z_pos = z_pos_or_error
            try:
                well_volume = self._state_view.geometry.get_well_volume_at_height(
                    labware_id=params.labwareId, well_name=params.wellName, height=z_pos
                )
            except IncompleteLabwareDefinitionError:
                well_volume = None

        state_update.set_liquid_probed(
            labware_id=params.labwareId,
            well_name=params.wellName,
            height=z_pos,
            volume=well_volume,
            last_probed=self._model_utils.get_timestamp(),
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
