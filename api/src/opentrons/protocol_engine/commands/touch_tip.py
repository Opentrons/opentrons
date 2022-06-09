"""Touch tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import BasePipettingParams
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

from opentrons.hardware_control import HardwareControlAPI

if TYPE_CHECKING:
    from ..execution import MovementHandler
    from ..state import StateView, CurrentWell


TouchTipCommandType = Literal["touchTip"]


class TouchTipParams(BasePipettingParams):
    """Payload needed to touch a pipette tip the sides of a specific well."""

    pass


class TouchTipResult(BaseModel):
    """Result data from the execution of a TouchTip."""

    pass


class TouchTipImplementation(AbstractCommandImpl[TouchTipParams, TouchTipResult]):
    """Touch tip command implementation."""

    def __init__(
        self,
        movement: MovementHandler,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        **kwargs: object,
    ) -> None:
        self._movement = movement
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(self, params: TouchTipParams) -> TouchTipResult:
        """Touch tip to sides of a well using the requested pipette."""
        target_well = CurrentWell(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
        )

        # get pipette mount and critical point for our touch tip moves
        pipette_location = self._state_view.motion.get_pipette_location(
            pipette_id=params.pipetteId,
            current_well=target_well,
        )

        touch_points = self._state_view.geometry.get_well_edges(
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
        )

        # this will handle raising if the thermocycler lid is in a bad state
        # so we don't need to put that logic elsewhere
        await self._movement.move_to_well(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
        )

        for position in touch_points:
            await self._hardware_api.move_to(
                mount=pipette_location.mount.to_hw_mount(),
                critical_point=pipette_location.critical_point,
                abs_position=position,
            )

        return TouchTipResult()


class TouchTip(BaseCommand[TouchTipParams, TouchTipResult]):
    """Touch up tip command model."""

    commandType: TouchTipCommandType = "touchTip"
    params: TouchTipParams
    result: Optional[TouchTipResult]

    _ImplementationCls: Type[TouchTipImplementation] = TouchTipImplementation


class TouchTipCreate(BaseCommandCreate[TouchTipParams]):
    """Touch tip command creation request model."""

    commandType: TouchTipCommandType = "touchTip"
    params: TouchTipParams

    _CommandCls: Type[TouchTip] = TouchTip
