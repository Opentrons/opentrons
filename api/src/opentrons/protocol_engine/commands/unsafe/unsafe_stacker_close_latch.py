"""Command models to close the latch of a Flex Stacker."""

from __future__ import annotations

from __future__ import annotations
from typing import Optional, Literal, TYPE_CHECKING
from typing_extensions import Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors import ErrorOccurrence

if TYPE_CHECKING:
    from ...state.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler

UnsafeFlexStackerCloseLatchCommandType = Literal["unsafe/flexStacker/closeLatch"]


class UnsafeFlexStackerCloseLatchParams(BaseModel):
    """The parameters defining how a stacker should close its latch."""

    moduleId: str = Field(..., description="Unique ID of the Flex Stacker")


class UnsafeFlexStackerCloseLatchResult(BaseModel):
    """Result data from a stacker UnsafeFlexStackerCloseLatch command."""


class UnsafeFlexStackerCloseLatchImpl(
    AbstractCommandImpl[
        UnsafeFlexStackerCloseLatchParams,
        SuccessData[UnsafeFlexStackerCloseLatchResult],
    ]
):
    """Implementation of a stacker UnsafeFlexStackerCloseLatch command."""

    def __init__(
        self, state_view: StateView, equipment: EquipmentHandler, **kwargs: object
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(
        self, params: UnsafeFlexStackerCloseLatchParams
    ) -> SuccessData[UnsafeFlexStackerCloseLatchResult]:
        """Execute the stacker UnsafeFlexStackerCloseLatch command.

        Closing the latch modifies the state of the flex stacker and affects its
        ability to execute the next command. This command should be used with care
        outside of a protocol.
        """
        stacker_state = self._state_view.modules.get_flex_stacker_substate(
            params.moduleId
        )
        stacker_hw = self._equipment.get_module_hardware_api(stacker_state.module_id)

        if stacker_hw is not None:
            await stacker_hw.close_latch()
        return SuccessData(public=UnsafeFlexStackerCloseLatchResult())


class UnsafeFlexStackerCloseLatch(
    BaseCommand[
        UnsafeFlexStackerCloseLatchParams,
        UnsafeFlexStackerCloseLatchResult,
        ErrorOccurrence,
    ]
):
    """A command to UnsafeFlexStackerCloseLatch the Flex Stacker of labware."""

    commandType: UnsafeFlexStackerCloseLatchCommandType = (
        "unsafe/flexStacker/closeLatch"
    )
    params: UnsafeFlexStackerCloseLatchParams
    result: Optional[UnsafeFlexStackerCloseLatchResult] = None

    _ImplementationCls: Type[
        UnsafeFlexStackerCloseLatchImpl
    ] = UnsafeFlexStackerCloseLatchImpl


class UnsafeFlexStackerCloseLatchCreate(
    BaseCommandCreate[UnsafeFlexStackerCloseLatchParams]
):
    """A request to execute a Flex Stacker UnsafeFlexStackerCloseLatch command."""

    commandType: UnsafeFlexStackerCloseLatchCommandType = (
        "unsafe/flexStacker/closeLatch"
    )
    params: UnsafeFlexStackerCloseLatchParams

    _CommandCls: Type[UnsafeFlexStackerCloseLatch] = UnsafeFlexStackerCloseLatch
