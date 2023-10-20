"""Prepare for aspirate command request, result, and implementation models."""

from __future__ import annotations
from pydantic import BaseModel
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import (
    PipetteIdMixin,
)
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)

if TYPE_CHECKING:
    from ..execution.pipetting import PipettingHandler

PrepareForAspirateCommandType = Literal["prepareForAspirate"]


class PrepareForAspirateParams(PipetteIdMixin):
    """Parameters required to prepare a specific pipette for aspiration."""

    pass


class PrepareForAspirateResult(BaseModel):
    """Result data from execution of an PrepareForAspirate command."""

    pass


class PrepareForAspirateImplementation(
    AbstractCommandImpl[
        PrepareForAspirateParams,
        PrepareForAspirateResult,
    ]
):
    """Prepare for aspirate command implementation."""

    def __init__(self, pipetting: PipettingHandler, **kwargs: object) -> None:
        self._pipetting_handler = pipetting

    async def execute(
        self, params: PrepareForAspirateParams
    ) -> PrepareForAspirateResult:
        """Prepare the pipette to aspirate."""
        await self._pipetting_handler.prepare_for_aspirate(
            pipette_id=params.pipetteId,
        )

        return PrepareForAspirateResult()


class PrepareForAspirate(
    BaseCommand[PrepareForAspirateParams, PrepareForAspirateResult]
):
    """Prepare for aspirate command model."""

    commandType: PrepareForAspirateCommandType = "prepareForAspirate"
    params: PrepareForAspirateParams
    result: Optional[PrepareForAspirateResult]

    _ImplementationCls: Type[
        PrepareForAspirateImplementation
    ] = PrepareForAspirateImplementation


class PrepareForAspirateCreate(BaseCommandCreate[PrepareForAspirateParams]):
    """Prepare for aspirate command creation request model."""

    commandType: PrepareForAspirateCommandType = "prepareForAspirate"
    params: PrepareForAspirateParams

    _CommandCls: Type[PrepareForAspirate] = PrepareForAspirate
