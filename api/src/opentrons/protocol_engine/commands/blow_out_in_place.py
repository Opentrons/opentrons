"""Blow-out in place command request, result, and implementation models."""

from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal
from pydantic import BaseModel

from .pipetting_common import (
    PipetteIdMixin,
    FlowRateMixin,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

from opentrons.hardware_control import HardwareControlAPI


if TYPE_CHECKING:
    from ..execution import PipettingHandler
    from ..state import StateView


BlowOutInPlaceCommandType = Literal["blowOutInPlace"]


class BlowOutInPlaceParams(PipetteIdMixin, FlowRateMixin):
    """Payload required to blow-out in place."""

    pass


class BlowOutInPlaceResult(BaseModel):
    """Result data from the execution of a BlowOutInPlace command."""

    pass


class BlowOutInPlaceImplementation(
    AbstractCommandImpl[BlowOutInPlaceParams, BlowOutInPlaceResult]
):
    """BlowOutInPlace command implementation."""

    def __init__(
        self,
        pipetting: PipettingHandler,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        **kwargs: object,
    ) -> None:
        self._pipetting = pipetting
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(self, params: BlowOutInPlaceParams) -> BlowOutInPlaceResult:
        """Blow-out without moving the pipette."""
        hw_pipette = self._state_view.pipettes.get_hardware_pipette(
            pipette_id=params.pipetteId,
            attached_pipettes=self._hardware_api.attached_instruments,
        )

        with self._pipetting.set_flow_rate(
            pipette=hw_pipette, blow_out_flow_rate=params.flowRate
        ):
            await self._hardware_api.blow_out(mount=hw_pipette.mount)

        return BlowOutInPlaceResult()


class BlowOutInPlace(BaseCommand[BlowOutInPlaceParams, BlowOutInPlaceResult]):
    """BlowOutInPlace command model."""

    commandType: BlowOutInPlaceCommandType = "blowOutInPlace"
    params: BlowOutInPlaceParams
    result: Optional[BlowOutInPlaceResult]

    _ImplementationCls: Type[
        BlowOutInPlaceImplementation
    ] = BlowOutInPlaceImplementation


class BlowOutInPlaceCreate(BaseCommandCreate[BlowOutInPlaceParams]):
    """BlowOutInPlace command request model."""

    commandType: BlowOutInPlaceCommandType = "blowOutInPlace"
    params: BlowOutInPlaceParams

    _CommandCls: Type[BlowOutInPlace] = BlowOutInPlace
