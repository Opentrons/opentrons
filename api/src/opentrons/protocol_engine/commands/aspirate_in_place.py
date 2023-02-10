"""Aspirate in place command request, result, and implementation models."""

# TODO(mm, 2022-08-15): This command is not yet in the JSON protocol schema.
# Before our production code emits this command, we must add it to the schema,
# and probably bump the schema version.

from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from opentrons.hardware_control import HardwareControlAPI

from .pipetting_common import (
    PipetteIdMixin,
    VolumeMixin,
    FlowRateMixin,
    BaseLiquidHandlingResult,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate
from ..errors.exceptions import PipetteNotReadyToAspirateError

if TYPE_CHECKING:
    from ..execution import PipettingHandler
    from ..state import StateView


AspirateInPlaceCommandType = Literal["aspirateInPlace"]


class AspirateInPlaceParams(PipetteIdMixin, VolumeMixin, FlowRateMixin):
    """Payload required to aspirate in place."""

    pass


class AspirateInPlaceResult(BaseLiquidHandlingResult):
    """Result data from the execution of a AspirateInPlace command."""

    pass


class AspirateInPlaceImplementation(
    AbstractCommandImpl[AspirateInPlaceParams, AspirateInPlaceResult]
):
    """AspirateInPlace command implementation."""

    def __init__(
        self,
        pipetting: PipettingHandler,
        hardware_api: HardwareControlAPI,
        state_view: StateView,
        **kwargs: object,
    ) -> None:
        self._pipetting = pipetting
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(self, params: AspirateInPlaceParams) -> AspirateInPlaceResult:
        """Aspirate without moving the pipette."""
        hw_pipette = self._state_view.pipettes.get_hardware_pipette(
            pipette_id=params.pipetteId,
            attached_pipettes=self._hardware_api.attached_instruments,
        )

        ready_to_aspirate = self._state_view.pipettes.get_is_ready_to_aspirate(
            pipette_id=params.pipetteId,
            pipette_config=hw_pipette.config,
        )

        if not ready_to_aspirate:
            raise PipetteNotReadyToAspirateError(
                "Pipette cannot aspirate in place because of a previous blow out."
                " The first aspirate following a blow-out must be from a specific well"
                " so the plunger can be reset in a known safe position."
            )

        with self._pipetting.set_flow_rate(
            pipette=hw_pipette, aspirate_flow_rate=params.flowRate
        ):
            await self._hardware_api.aspirate(
                mount=hw_pipette.mount, volume=params.volume
            )

        return AspirateInPlaceResult(volume=params.volume)


class AspirateInPlace(BaseCommand[AspirateInPlaceParams, AspirateInPlaceResult]):
    """AspirateInPlace command model."""

    commandType: AspirateInPlaceCommandType = "aspirateInPlace"
    params: AspirateInPlaceParams
    result: Optional[AspirateInPlaceResult]

    _ImplementationCls: Type[
        AspirateInPlaceImplementation
    ] = AspirateInPlaceImplementation


class AspirateInPlaceCreate(BaseCommandCreate[AspirateInPlaceParams]):
    """AspirateInPlace command request model."""

    commandType: AspirateInPlaceCommandType = "aspirateInPlace"
    params: AspirateInPlaceParams

    _CommandCls: Type[AspirateInPlace] = AspirateInPlace
