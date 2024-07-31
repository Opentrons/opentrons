"""Command models to drop tip in place while plunger positions are unknown."""
from __future__ import annotations
from pydantic import Field, BaseModel
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import Axis

from ..pipetting_common import PipetteIdMixin
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors.error_occurrence import ErrorOccurrence
from ...resources import ensure_ot3_hardware

if TYPE_CHECKING:
    from ...execution import TipHandler
    from ...state import StateView


UnsafeDropTipInPlaceCommandType = Literal["unsafe/dropTipInPlace"]


class UnsafeDropTipInPlaceParams(PipetteIdMixin):
    """Payload required to drop a tip in place even if the plunger position is not known."""

    homeAfter: Optional[bool] = Field(
        None,
        description=(
            "Whether to home this pipette's plunger after dropping the tip."
            " You should normally leave this unspecified to let the robot choose"
            " a safe default depending on its hardware."
        ),
    )


class UnsafeDropTipInPlaceResult(BaseModel):
    """Result data from the execution of an UnsafeDropTipInPlace command."""

    pass


class UnsafeDropTipInPlaceImplementation(
    AbstractCommandImpl[
        UnsafeDropTipInPlaceParams, SuccessData[UnsafeDropTipInPlaceResult, None]
    ]
):
    """Unsafe drop tip in place command implementation."""

    def __init__(
        self,
        tip_handler: TipHandler,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._tip_handler = tip_handler
        self._hardware_api = hardware_api

    async def execute(
        self, params: UnsafeDropTipInPlaceParams
    ) -> SuccessData[UnsafeDropTipInPlaceResult, None]:
        """Drop a tip using the requested pipette, even if the plunger position is not known."""
        ot3_hardware_api = ensure_ot3_hardware(self._hardware_api)
        pipette_location = self._state_view.motion.get_pipette_location(
            params.pipetteId
        )
        await ot3_hardware_api.update_axis_position_estimations(
            [Axis.of_main_tool_actuator(pipette_location.mount.to_hw_mount())]
        )
        await self._tip_handler.drop_tip(
            pipette_id=params.pipetteId, home_after=params.homeAfter
        )

        return SuccessData(public=UnsafeDropTipInPlaceResult(), private=None)


class UnsafeDropTipInPlace(
    BaseCommand[UnsafeDropTipInPlaceParams, UnsafeDropTipInPlaceResult, ErrorOccurrence]
):
    """Drop tip in place command model."""

    commandType: UnsafeDropTipInPlaceCommandType = "unsafe/dropTipInPlace"
    params: UnsafeDropTipInPlaceParams
    result: Optional[UnsafeDropTipInPlaceResult]

    _ImplementationCls: Type[
        UnsafeDropTipInPlaceImplementation
    ] = UnsafeDropTipInPlaceImplementation


class UnsafeDropTipInPlaceCreate(BaseCommandCreate[UnsafeDropTipInPlaceParams]):
    """Drop tip in place command creation request model."""

    commandType: UnsafeDropTipInPlaceCommandType = "unsafe/dropTipInPlace"
    params: UnsafeDropTipInPlaceParams

    _CommandCls: Type[UnsafeDropTipInPlace] = UnsafeDropTipInPlace
