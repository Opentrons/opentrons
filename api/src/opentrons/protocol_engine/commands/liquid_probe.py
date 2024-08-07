"""The liquidProbe and tryLiquidProbe commands."""

from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type, Union
from opentrons.protocol_engine.errors.exceptions import MustHomeError, TipNotEmptyError
from opentrons.types import MountType
from opentrons_shared_data.errors.exceptions import (
    PipetteLiquidNotFoundError,
)
from typing_extensions import Literal

from pydantic import Field

from ..types import DeckPoint
from .pipetting_common import (
    LiquidNotFoundError,
    LiquidNotFoundErrorInternalData,
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
    DefinedErrorData[LiquidNotFoundError, LiquidNotFoundErrorInternalData],
]
_TryLiquidProbeExecuteReturn = SuccessData[TryLiquidProbeResult, None]


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
        pipette_id = params.pipetteId
        labware_id = params.labwareId
        well_name = params.wellName

        # _validate_tip_attached in pipetting.py is a private method so we're using
        # get_is_ready_to_aspirate as an indirect way to throw a TipNotAttachedError if appropriate
        self._pipetting.get_is_ready_to_aspirate(pipette_id=pipette_id)

        if self._pipetting.get_is_empty(pipette_id=pipette_id) is False:
            raise TipNotEmptyError(
                message="This operation requires a tip with no liquid in it."
            )

        if await self._movement.check_for_valid_position(mount=MountType.LEFT) is False:
            raise MustHomeError(
                message="Current position of pipette is invalid. Please home."
            )

        # liquid_probe process start position
        position = await self._movement.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=params.wellLocation,
        )

        try:
            z_pos = await self._pipetting.liquid_probe_in_place(
                pipette_id=pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=params.wellLocation,
            )
        except PipetteLiquidNotFoundError as e:
            return DefinedErrorData(
                public=LiquidNotFoundError(
                    id=self._model_utils.generate_id(),
                    createdAt=self._model_utils.get_timestamp(),
                    wrappedErrors=[
                        ErrorOccurrence.from_failed(
                            id=self._model_utils.generate_id(),
                            createdAt=self._model_utils.get_timestamp(),
                            error=e,
                        )
                    ],
                ),
                private=LiquidNotFoundErrorInternalData(
                    position=DeckPoint(x=position.x, y=position.y, z=position.z)
                ),
            )
        else:
            return SuccessData(
                public=LiquidProbeResult(
                    z_position=z_pos,
                    position=DeckPoint(x=position.x, y=position.y, z=position.z),
                ),
                private=None,
            )


class TryLiquidProbeImplementation(
    AbstractCommandImpl[TryLiquidProbeParams, _TryLiquidProbeExecuteReturn]
):
    """The implementation of a `tryLiquidProbe` command."""

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

    async def execute(self, params: _CommonParams) -> _TryLiquidProbeExecuteReturn:
        """Execute a `tryLiquidProbe` command.

        `tryLiquidProbe` is identical to `liquidProbe`, except that if no liquid is
        found, `tryLiquidProbe` returns a success result with `z_position=null` instead
        of a defined error.
        """
        # We defer to the `liquidProbe` implementation. If it returns a defined
        # `liquidNotFound` error, we remap that to a success result.
        # Otherwise, we return the result or propagate the exception unchanged.

        original_impl = LiquidProbeImplementation(
            movement=self._movement,
            pipetting=self._pipetting,
            model_utils=self._model_utils,
        )
        original_result = await original_impl.execute(params)

        match original_result:
            case DefinedErrorData(
                public=LiquidNotFoundError(),
                private=LiquidNotFoundErrorInternalData() as original_private,
            ):
                return SuccessData(
                    public=TryLiquidProbeResult(
                        z_position=None,
                        position=original_private.position,
                    ),
                    private=None,
                )
            case SuccessData(
                public=LiquidProbeResult() as original_public, private=None
            ):
                return SuccessData(
                    public=TryLiquidProbeResult(
                        position=original_public.position,
                        z_position=original_public.z_position,
                    ),
                    private=None,
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
