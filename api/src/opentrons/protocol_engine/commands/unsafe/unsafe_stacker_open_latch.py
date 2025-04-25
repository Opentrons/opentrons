"""Command models to open the latch of a Flex Stacker."""

from __future__ import annotations

from __future__ import annotations
from typing import Optional, Literal, TYPE_CHECKING
from typing_extensions import Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors import (
    ErrorOccurrence,
)

if TYPE_CHECKING:
    from ...state.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler

UnsafeFlexStackerOpenLatchCommandType = Literal["unsafe/flexStacker/openLatch"]


class UnsafeFlexStackerOpenLatchParams(BaseModel):
    """The parameters defining how a stacker should open its latch."""

    moduleId: str = Field(..., description="Unique ID of the Flex Stacker")


class UnsafeFlexStackerOpenLatchResult(BaseModel):
    """Result data from a stacker UnsafeFlexStackerOpenLatch command."""


class UnsafeFlexStackerOpenLatchImpl(
    AbstractCommandImpl[
        UnsafeFlexStackerOpenLatchParams, SuccessData[UnsafeFlexStackerOpenLatchResult]
    ]
):
    """Implementation of a stacker UnsafeFlexStackerOpenLatch command."""

    def __init__(
        self, state_view: StateView, equipment: EquipmentHandler, **kwargs: object
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(
        self, params: UnsafeFlexStackerOpenLatchParams
    ) -> SuccessData[UnsafeFlexStackerOpenLatchResult]:
        """Execute the stacker UnsafeFlexStackerOpenLatch command.

        Opening the latch could result in labware falling down the stacker hopper,
        resulting in an error state. This command should be used with care, outside of
        a protocol and followed by a close latch command.
        """
        stacker_state = self._state_view.modules.get_flex_stacker_substate(
            params.moduleId
        )
        stacker_hw = self._equipment.get_module_hardware_api(stacker_state.module_id)

        if stacker_hw is not None:
            await stacker_hw.open_latch()
        return SuccessData(public=UnsafeFlexStackerOpenLatchResult())


class UnsafeFlexStackerOpenLatch(
    BaseCommand[
        UnsafeFlexStackerOpenLatchParams,
        UnsafeFlexStackerOpenLatchResult,
        ErrorOccurrence,
    ]
):
    """A command to UnsafeFlexStackerOpenLatch the Flex Stacker of labware."""

    commandType: UnsafeFlexStackerOpenLatchCommandType = "unsafe/flexStacker/openLatch"
    params: UnsafeFlexStackerOpenLatchParams
    result: Optional[UnsafeFlexStackerOpenLatchResult] = None

    _ImplementationCls: Type[
        UnsafeFlexStackerOpenLatchImpl
    ] = UnsafeFlexStackerOpenLatchImpl


class UnsafeFlexStackerOpenLatchCreate(
    BaseCommandCreate[UnsafeFlexStackerOpenLatchParams]
):
    """A request to execute a Flex Stacker UnsafeFlexStackerOpenLatch command."""

    commandType: UnsafeFlexStackerOpenLatchCommandType = "unsafe/flexStacker/openLatch"
    params: UnsafeFlexStackerOpenLatchParams

    _CommandCls: Type[UnsafeFlexStackerOpenLatch] = UnsafeFlexStackerOpenLatch
