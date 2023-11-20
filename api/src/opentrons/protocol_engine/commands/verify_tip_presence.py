"""Get tip presence command request, result and implementation models."""
from __future__ import annotations

from pydantic import Field, BaseModel
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import PipetteIdMixin
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


if TYPE_CHECKING:
    from ..state import StateView
    from ..execution import MovementHandler, TipHandler
    from ..types import TipPresenceStatus


VerifyTipPresenceCommandType = Literal["verifyTipPresence"]


class VerifyTipPresenceParams(PipetteIdMixin):
    """Payload required for a VerifyTipPresence command."""
    
    expected_state: TipPresenceStatus = Field(
        ...,
        description="The expected tip presence status on the pipette."
    )


class VerifyTipPresenceResult(BaseModel):
    """Result data from the execution of a VerifyTipPresence command."""

    success: bool = Field(
        ...,
        description="Whether or not tip presence matches expectations."
    )


class VerifyTipPresenceImplementation(
    AbstractCommandImpl[VerifyTipPresenceParams, VerifyTipPresenceResult]
):
    """VerifyTipPresence command implementation."""

    def __init__(
        self,
        state_view: StateView,
        tip_handler: TipHandler,
        movement: MovementHandler,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._tip_handler = tip_handler
        self._movement_handler = movement

    async def execute(self, params: VerifyTipPresenceParams) -> VerifyTipPresenceResult:
        """Verify if tip presence is as expected for the requested pipette."""
        pipette_id = params.pipetteId
        presence = params.present

        result = await self._tip_handler.verify_tip_presence(
            pipette_id=pipette_id,
            expected=
        )

        return VerifyTipPresenceResult(success=result)


class VerifyTipPresence(BaseCommand[VerifyTipPresenceParams, VerifyTipPresenceResult]):
    """VerifyTipPresence command model."""

    commandType: VerifyTipPresenceCommandType = "verifyTipPresence"
    params: VerifyTipPresence
    result: Optional[VerifyTipPresenceResult]

    _ImplementationCls: Type[VerifyTipPresenceImplementation] = VerifyTipPresenceImplementation


class VerifyTipPresenceCreate(BaseCommandCreate[VerifyTipPresenceParams]):
    """VerifyTipPresence command creation request model."""

    commandType: VerifyTipPresenceCommandType = "verifyTipPresence"
    params: VerifyTipPresenceParams

    _CommandCls: Type[VerifyTipPresence] = VerifyTipPresence
