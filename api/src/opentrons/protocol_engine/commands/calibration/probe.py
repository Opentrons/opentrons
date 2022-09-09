"""Blow-out command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal
from pydantic import BaseModel

from opentrons.types import Mount
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

from opentrons.hardware_control import HardwareControlAPI


BeginProbeCommandType = Literal["beginprobe"]


class BeginProbeParams(BaseModel):
    """Payload required to begin-probe."""
    mount: Mount


class BeginProbeResult(BaseModel):
    """Result data from the execution of a begin-probe command."""

    pass


class BeginProbeImplementation(AbstractCommandImpl[BeginProbeParams, BeginProbeResult]):
    """BeginProbe command implementation."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        **kwargs: object,
    ) -> None:
        self._hardware_api = hardware_api

    async def execute(self, params: BeginProbeParams) -> BeginProbeResult:
        """Execute begin-probe command."""
        # result = await self._hardware_api.probe(mount=params.mount)

        return BeginProbeResult()


class BeginProbe(BaseCommand[BeginProbeParams, BeginProbeResult]):
    """Begin-probe command model."""

    commandType: BeginProbeCommandType = "beginprobe"
    params: BeginProbeParams
    result: Optional[BeginProbeResult]

    _ImplementationCls: Type[BeginProbeImplementation] = BeginProbeImplementation


class BeginProbeCreate(BaseCommandCreate[BeginProbeParams]):
    """Create begin-probe command request model."""

    commandType: BeginProbeCommandType = "beginprobe"
    params: BeginProbeParams

    _CommandCls: Type[BeginProbe] = BeginProbe
