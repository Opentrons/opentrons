"""Models and implementation for the ``moveLabwareOffDeck`` command."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import RunControlHandler
    from ..state import StateView


MoveLabwareOffDeckCommandType = Literal["moveLabwareOffDeck"]


class MoveLabwareOffDeckParams(BaseModel):
    """Input parameters for a ``moveLabwareOffDeck`` command."""

    labwareId: str = Field(..., description="The ID of the labware to move.")


class MoveLabwareOffDeckResult(BaseModel):
    """The output of a successful ``moveLabwareOffDeck`` command."""


class MoveLabwareOffDeckImplementation(
    AbstractCommandImpl[MoveLabwareOffDeckParams, MoveLabwareOffDeckResult]
):
    """The execution implementation for ``moveLabwareOffDeck`` commands."""

    def __init__(
        self, state_view: StateView, run_control: RunControlHandler, **kwargs: object
    ) -> None:
        self._state_view = state_view
        self._run_control = run_control

    async def execute(
        self, params: MoveLabwareOffDeckParams
    ) -> MoveLabwareOffDeckResult:
        """Move a loaded labware off the deck."""
        # Allow propagation of LabwareNotLoadedError.
        self._state_view.labware.get(labware_id=params.labwareId)

        await self._run_control.wait_for_resume()
        return MoveLabwareOffDeckResult()


class MoveLabwareOffDeck(
    BaseCommand[MoveLabwareOffDeckParams, MoveLabwareOffDeckResult]
):
    """A ``moveLabwareOffDeck`` command."""

    commandType: MoveLabwareOffDeckCommandType = "moveLabwareOffDeck"
    params: MoveLabwareOffDeckParams
    result: Optional[MoveLabwareOffDeckResult]

    _ImplementationCls: Type[
        MoveLabwareOffDeckImplementation
    ] = MoveLabwareOffDeckImplementation


class MoveLabwareOffDeckCreate(BaseCommandCreate[MoveLabwareOffDeckParams]):
    """A request to create a ``moveLabwareOffDeck`` command."""

    commandType: MoveLabwareOffDeckCommandType = "moveLabwareOffDeck"
    params: MoveLabwareOffDeckParams

    _CommandCls: Type[MoveLabwareOffDeck] = MoveLabwareOffDeck
