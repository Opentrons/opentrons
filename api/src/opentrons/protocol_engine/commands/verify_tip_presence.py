"""Verify tip presence command request, result and implementation models."""
from __future__ import annotations

from pydantic import Field, BaseModel
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import PipetteIdMixin
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

from ..types import TipPresenceStatus

if TYPE_CHECKING:
    from ..execution import TipHandler


VerifyTipPresenceCommandType = Literal["verifyTipPresence"]


class VerifyTipPresenceParams(PipetteIdMixin):
    """Payload required for a VerifyTipPresence command."""

    expectedState: TipPresenceStatus = Field(
        ..., description="The expected tip presence status on the pipette."
    )


class VerifyTipPresenceResult(BaseModel):
    """Result data from the execution of a VerifyTipPresence command."""

    pass


class VerifyTipPresenceImplementation(
    AbstractCommandImpl[VerifyTipPresenceParams, VerifyTipPresenceResult]
):
    """VerifyTipPresence command implementation."""

    def __init__(
        self,
        tip_handler: TipHandler,
        **kwargs: object,
    ) -> None:
        self._tip_handler = tip_handler

    async def execute(self, params: VerifyTipPresenceParams) -> VerifyTipPresenceResult:
        """Verify if tip presence is as expected for the requested pipette."""
        pipette_id = params.pipetteId
        expected_state = params.expectedState

        await self._tip_handler.verify_tip_presence(
            pipette_id=pipette_id,
            expected=expected_state,
        )

        return VerifyTipPresenceResult()


class VerifyTipPresence(BaseCommand[VerifyTipPresenceParams, VerifyTipPresenceResult]):
    """VerifyTipPresence command model."""

    commandType: VerifyTipPresenceCommandType = "verifyTipPresence"
    params: VerifyTipPresenceParams
    result: Optional[VerifyTipPresenceResult]

    _ImplementationCls: Type[
        VerifyTipPresenceImplementation
    ] = VerifyTipPresenceImplementation


class VerifyTipPresenceCreate(BaseCommandCreate[VerifyTipPresenceParams]):
    """VerifyTipPresence command creation request model."""

    commandType: VerifyTipPresenceCommandType = "verifyTipPresence"
    params: VerifyTipPresenceParams

    _CommandCls: Type[VerifyTipPresence] = VerifyTipPresence
