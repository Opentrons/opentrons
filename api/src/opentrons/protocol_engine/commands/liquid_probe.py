"""Liquid-probe command for OT3 hardware. request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type, Union
from opentrons_shared_data.errors.exceptions import PipetteLiquidNotFoundError
from typing_extensions import Literal

from pydantic import Field

from ..types import WellLocation, WellOrigin, CurrentWell, DeckPoint
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
            LiquidNotFoundError: if liquid is not found during the probe process.
        """
        pipette_id = params.pipetteId
        labware_id = params.labwareId
        well_name = params.wellName

        ready_to_probe = self._pipetting.get_is_ready_to_aspirate(pipette_id=pipette_id)

        current_well = None

        if not ready_to_probe:
            await self._movement.move_to_well(
                pipette_id=pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=WellLocation(origin=WellOrigin.TOP),
            )

            current_well = CurrentWell(
                pipette_id=pipette_id,
                labware_id=labware_id,
                well_name=well_name,
            )

        # liquid_probe process start position
        position = await self._movement.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=params.wellLocation,
            current_well=current_well,
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
