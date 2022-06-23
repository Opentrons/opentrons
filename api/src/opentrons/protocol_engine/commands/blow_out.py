"""Blow-out command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal
from pydantic import BaseModel

from .pipetting_common import PipetteIdMixin, FlowRateMixin, WellLocationMixin
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

from opentrons.hardware_control import HardwareControlAPI


if TYPE_CHECKING:
    from ..execution import MovementHandler, PipettingHandler
    from ..state import StateView

BlowOutCommandType = Literal["blowout"]


class BlowOutParams(PipetteIdMixin, FlowRateMixin, WellLocationMixin):
    """Payload required to blow-out a specific well."""

    pass


class BlowOutResult(BaseModel):
    """Result data from the execution of a blow-out command."""

    pass


class BlowOutImplementation(AbstractCommandImpl[BlowOutParams, BlowOutResult]):
    """BlowOut command implementation."""

    def __init__(
        self,
        movement: MovementHandler,
        pipetting: PipettingHandler,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        **kwargs: object,
    ) -> None:
        self._movement = movement
        self._pipetting = pipetting
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(self, params: BlowOutParams) -> BlowOutResult:
        """Move to and blow-out the requested well."""
        hw_pipette = self._state_view.pipettes.get_hardware_pipette(
            pipette_id=params.pipetteId,
            attached_pipettes=self._hardware_api.attached_instruments,
        )

        await self._movement.move_to_well(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
        )

        with self._pipetting.set_flow_rate(
            pipette=hw_pipette, blow_out_flow_rate=params.flowRate
        ):
            await self._hardware_api.blow_out(mount=hw_pipette.mount)

        return BlowOutResult()


class BlowOut(BaseCommand[BlowOutParams, BlowOutResult]):
    """Blow-out command model."""

    commandType: BlowOutCommandType = "blowout"
    params: BlowOutParams
    result: Optional[BlowOutResult]

    _ImplementationCls: Type[BlowOutImplementation] = BlowOutImplementation


class BlowOutCreate(BaseCommandCreate[BlowOutParams]):
    """Create blow-out command request model."""

    commandType: BlowOutCommandType = "blowout"
    params: BlowOutParams

    _CommandCls: Type[BlowOut] = BlowOut
