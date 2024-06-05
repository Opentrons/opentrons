"""Liquid-probe command for OT3 hardware. request, result, and implementation models."""
from typing import Optional, Type
from typing_extensions import Literal
from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors.error_occurrence import ErrorOccurrence

from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import OT3Mount

from opentrons.types import MountType

LiquidProbeCommandType = Literal["liquidProbe"]


class LiquidProbeParams(BaseModel):
    """Payload required to liquid probe."""

    mount: MountType = Field(..., description="Instrument mount to liquid probe with.")


class LiquidProbeResult(BaseModel):
    """Result data from the execution of a liquid-probe command."""

    z_position: float = Field(  # correct?
        ..., description="Z position of the found liquid."
    )


class LiquidProbeImplementation(
    AbstractCommandImpl[LiquidProbeParams, SuccessData[LiquidProbeResult, None]]
):
    """The implementation of a `liquidProbe` command."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        *args: object,
        **kwargs: object,
    ) -> None:
        self._hardware_api = hardware_api

    async def execute(
        self, params: LiquidProbeParams
    ) -> SuccessData[LiquidProbeResult, None]:
        """Execute a `liquidProbe` command.

        Return the z-position of the found liquid.
        """
        # LiquidNotFoundError exception raised in ot3controller
        # assumption: scope discludes moving to process starting position
        # account for labware (height)?

        ot3_api = ensure_ot3_hardware(self._hardware_api)
        ot3_mount = OT3Mount.from_mount(params.mount)
        assert (
            ot3_mount is not OT3Mount.GRIPPER
        ), "Expected a Pipette mount but Gripper mount was provided."

        z_pos = ot3_api.liquid_probe(mount=ot3_mount)  # anything else?

        return SuccessData(
            public=LiquidProbeResult.construct(z_position=float(z_pos)),  # correct?
            private=None,
        )


class LiquidProbe(BaseCommand[LiquidProbeParams, LiquidProbeResult, ErrorOccurrence]):
    """A `liquidProbe` command."""

    commandType: LiquidProbeCommandType = "liquidProbe"
    params: LiquidProbeParams
    result: Optional[LiquidProbeResult]

    _ImplementationCls: Type[LiquidProbeImplementation] = LiquidProbeImplementation


class LiquidProbeCreate(BaseCommandCreate[LiquidProbeParams]):
    """A request to create a `liquidProbe` command."""

    commandType: LiquidProbeCommandType = "liquidProbe"
    params: LiquidProbeParams

    _CommandCls: Type[LiquidProbe] = LiquidProbe
