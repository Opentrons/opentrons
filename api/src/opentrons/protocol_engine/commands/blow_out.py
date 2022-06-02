"""Blow-out command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import BasePipettingParams
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import PipettingHandler


BlowOutCommandType = Literal["blow-out"]


class BlowOutParams(BasePipettingParams):
    """Payload required to blow-out to a specific well."""

    pass


class BlowOutResult(BasePipettingParams):
    """Result data from the execution of a Blow-out command."""

    pass


class BlowOutImplementation(AbstractCommandImpl[BlowOutParams, BlowOutResult]):
    """Dispense command implementation."""

    def __init__(self, pipetting: PipettingHandler, **kwargs: object) -> None:
        self._pipetting = pipetting

    async def execute(self, params: BlowOutParams) -> BlowOutResult:
        """Move to and blow-out to the requested well."""
        await self._pipetting.blow_out(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
        )

        return BlowOutResult(
            pipetteId=params.pipetteId,
            labwareId=params.labwareId,
            wellName=params.wellName,
            wellLocation=params.wellLocation
        )


class BlowOut(BaseCommand[BlowOutParams, BlowOutResult]):
    """Dispense command model."""

    commandType: BlowOutCommandType = "blow-out"
    params: BlowOutParams
    result: Optional[BlowOutResult]

    _ImplementationCls: Type[BlowOutImplementation] = BlowOutImplementation


class BlowOutCreate(BaseCommandCreate[BlowOutParams]):
    """Create dispense command request model."""

    commandType: BlowOutCommandType = "blow-out"
    params: BlowOutParams

    _CommandCls: Type[BlowOut] = BlowOut
