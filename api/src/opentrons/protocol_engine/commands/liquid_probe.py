"""Liquid-probe command for OT3 hardware. request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type, Union
from opentrons.protocol_engine.errors.exceptions import MustHomeError, TipNotEmptyError
from opentrons.types import MountType
from opentrons_shared_data.errors.exceptions import (
    PipetteLiquidNotFoundError,
)
from typing_extensions import Literal

from pydantic import Field

from ..types import CurrentWell, DeckPoint, WellLocation, WellOrigin
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


class LiquidProbeParams(PipetteIdMixin, WellLocationMixin):
    """Parameters required to liquid probe a specific well."""

    pass


class LiquidProbeResult(DestinationPositionResult):
    """Result data from the execution of a liquid-probe command."""

    z_position: float = Field(
        ..., description="The Z coordinate, in mm, of the found liquid in deck space."
    )
    # New fields should use camelCase. z_position is snake_case for historical reasons.


_ExecuteReturn = Union[
    SuccessData[LiquidProbeResult, None],
    DefinedErrorData[LiquidNotFoundError, LiquidNotFoundErrorInternalData],
]


class LiquidProbeImplementation(AbstractCommandImpl[LiquidProbeParams, _ExecuteReturn]):
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

    async def execute(self, params: LiquidProbeParams) -> _ExecuteReturn:
        """Move to and liquid probe the requested well.

        Return the z-position of the found liquid.

        Raises:
            TipNotAttachedError: if there is no tip attached to the pipette
            MustHomeError: if the plunger is not in a valid position
            TipNotEmptyError: if the tip starts with liquid in it
            LiquidNotFoundError: if liquid is not found during the probe process.
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
                pipette_id=pipette_id, labware_id=labware_id, well_name=well_name
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


class LiquidProbe(BaseCommand[LiquidProbeParams, LiquidProbeResult, ErrorOccurrence]):
    """LiquidProbe command model."""

    commandType: LiquidProbeCommandType = "liquidProbe"
    params: LiquidProbeParams
    result: Optional[LiquidProbeResult]

    _ImplementationCls: Type[LiquidProbeImplementation] = LiquidProbeImplementation


class LiquidProbeCreate(BaseCommandCreate[LiquidProbeParams]):
    """Create LiquidProbe command request model."""

    commandType: LiquidProbeCommandType = "liquidProbe"
    params: LiquidProbeParams

    _CommandCls: Type[LiquidProbe] = LiquidProbe
