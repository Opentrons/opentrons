"""Prepare to aspirate command request, result, and implementation models."""

from __future__ import annotations
from pydantic import BaseModel
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import (
    PipetteIdMixin,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from ..execution.pipetting import PipettingHandler

PrepareToAspirateCommandType = Literal["prepareToAspirate"]


class PrepareToAspirateParams(PipetteIdMixin):
    """Parameters required to prepare a specific pipette for aspiration."""

    pass


class PrepareToAspirateResult(BaseModel):
    """Result data from execution of an PrepareToAspirate command."""

    pass


class PrepareToAspirateImplementation(
    AbstractCommandImpl[
        PrepareToAspirateParams, SuccessData[PrepareToAspirateResult, None]
    ]
):
    """Prepare for aspirate command implementation."""

    def __init__(self, pipetting: PipettingHandler, **kwargs: object) -> None:
        self._pipetting_handler = pipetting

    async def execute(
        self, params: PrepareToAspirateParams
    ) -> SuccessData[PrepareToAspirateResult, None]:
        """Prepare the pipette to aspirate."""
        await self._pipetting_handler.prepare_for_aspirate(
            pipette_id=params.pipetteId,
        )

        return SuccessData(public=PrepareToAspirateResult(), private=None)


class PrepareToAspirate(
    BaseCommand[PrepareToAspirateParams, PrepareToAspirateResult, ErrorOccurrence]
):
    """Prepare for aspirate command model."""

    commandType: PrepareToAspirateCommandType = "prepareToAspirate"
    params: PrepareToAspirateParams
    result: Optional[PrepareToAspirateResult]

    _ImplementationCls: Type[
        PrepareToAspirateImplementation
    ] = PrepareToAspirateImplementation


class PrepareToAspirateCreate(BaseCommandCreate[PrepareToAspirateParams]):
    """Prepare for aspirate command creation request model."""

    commandType: PrepareToAspirateCommandType = "prepareToAspirate"
    params: PrepareToAspirateParams

    _CommandCls: Type[PrepareToAspirate] = PrepareToAspirate
