"""Set tip state command request, result, and implementation models."""

from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional, Type

from pydantic import BaseModel, Field
from typing_extensions import Literal

from ..errors.error_occurrence import ErrorOccurrence
from ..state.update_types import StateUpdate
from ..types import TipRackWellState
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
)

if TYPE_CHECKING:
    from ..state.state import StateView


SetTipStateCommandType = Literal["setTipState"]


class SetTipStateParams(BaseModel):
    """Payload needed to set tip wells of a tip rack to the requested state."""

    labwareId: str = Field(
        ..., description="Identifier of tip rack labware to set tip wells in."
    )
    wellNames: List[str] = Field(
        ..., description="Names of the well to set tip well state for."
    )
    tipWellState: TipRackWellState = Field(
        ..., description="State to set tip wells to."
    )


class SetTipStateResult(BaseModel):
    """Result data from the execution of a setTipState command."""

    pass


class SetTipStateImplementation(
    AbstractCommandImpl[SetTipStateParams, SuccessData[SetTipStateResult]]
):
    """Set tip state command implementation."""

    def __init__(
        self,
        state_view: StateView,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view

    async def execute(
        self, params: SetTipStateParams
    ) -> SuccessData[SetTipStateResult]:
        """Set the tip rack wells to the requested state."""
        labware_id = params.labwareId
        well_names = params.wellNames

        self._state_view.labware.raise_if_not_tip_rack(labware_id=labware_id)
        self._state_view.labware.raise_if_wells_are_invalid(
            labware_id=labware_id, well_names=well_names
        )

        return SuccessData(
            public=SetTipStateResult(),
            state_update=StateUpdate().update_tip_rack_well_state(
                tip_state=params.tipWellState,
                labware_id=labware_id,
                well_names=well_names,
            ),
        )


class SetTipState(BaseCommand[SetTipStateParams, SetTipStateResult, ErrorOccurrence]):
    """Set tip state command model."""

    commandType: SetTipStateCommandType = "setTipState"
    params: SetTipStateParams
    result: Optional[SetTipStateResult] = None

    _ImplementationCls: Type[SetTipStateImplementation] = SetTipStateImplementation


class SetTipStateCreate(BaseCommandCreate[SetTipStateParams]):
    """Set tip state command creation request model."""

    commandType: SetTipStateCommandType = "setTipState"
    params: SetTipStateParams

    _CommandCls: Type[SetTipState] = SetTipState
