"""Blow-out command request, result, and implementation models."""
from __future__ import annotations
from typing import Optional, Type, List
from typing_extensions import Literal
from pydantic import BaseModel, Field

from opentrons.types import Mount
from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    ErrorOccurrence,
)

from opentrons.hardware_control import HardwareControlAPI


ProbeCommandType = Literal["probe"]


class ProbeParams(BaseModel):
    """Payload required to probe."""

    # Should this be OT3Mount?
    mount: Mount = Field(..., description="Instrument mount to calibrate.")


class ProbeResult(BaseModel):
    """Result data from the execution of a probe command."""

    offsets: List[float] = Field(..., description="Instrument calibration offsets.")
    errors: Optional[List[ErrorOccurrence]] = Field(
        default_factory=None, description="Instrument calibration offsets."
    )


class ProbeImplementation(AbstractCommandImpl[ProbeParams, ProbeResult]):
    """Probe command implementation."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        **kwargs: object,
    ) -> None:
        self._hardware_api = hardware_api

    async def execute(self, params: ProbeParams) -> ProbeResult:
        """Execute probe command."""
        # result = await self._hardware_api.probe(mount=params.mount)

        return ProbeResult(offsets=[])


class Probe(BaseCommand[ProbeParams, ProbeResult]):
    """Probe command model."""

    commandType: ProbeCommandType = "probe"
    params: ProbeParams
    result: Optional[ProbeResult]

    _ImplementationCls: Type[ProbeImplementation] = ProbeImplementation


class ProbeCreate(BaseCommandCreate[ProbeParams]):
    """Create probe command request model."""

    commandType: ProbeCommandType = "probe"
    params: ProbeParams

    _CommandCls: Type[Probe] = Probe
