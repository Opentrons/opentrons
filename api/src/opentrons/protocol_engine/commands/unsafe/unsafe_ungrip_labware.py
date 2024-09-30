"""Update position estimators payload, result, and implementaiton."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, List, Type
from typing_extensions import Literal

from ...types import MotorAxis
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors.error_occurrence import ErrorOccurrence
from ...resources import ensure_ot3_hardware

from opentrons.hardware_control import HardwareControlAPI

if TYPE_CHECKING:
    from ...execution import GantryMover


UnsafeUngripLabwareCommandType = Literal["unsafe/ungripLabware"]


class UnsafeUngripLabwareParams(BaseModel):
    """Payload required for an UngripLabware command."""


class UnsafeUngripLabwareResult(BaseModel):
    """Result data from the execution of an UngripLabware command."""


class UnsafeUngripLabwareImplementation(
    AbstractCommandImpl[
        UnsafeUngripLabwareParams,
        SuccessData[UnsafeUngripLabwareResult, None],
    ]
):
    """Ungrip labware command implementation."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        gantry_mover: GantryMover,
        **kwargs: object,
    ) -> None:
        self._hardware_api = hardware_api
        self._gantry_mover = gantry_mover

    async def execute(
        self, params: UnsafeUngripLabwareParams
    ) -> SuccessData[UnsafeUngripLabwareResult, None]:
        """Ungrip Llabware."""
        ot3_hardware_api = ensure_ot3_hardware(self._hardware_api)
        await ot3_hardware_api.ungrip()
        return SuccessData(public=UnsafeUngripLabwareResult(), private=None)


class UnsafeUngripLabware(
    BaseCommand[UnsafeUngripLabwareParams, UnsafeUngripLabwareResult, ErrorOccurrence]
):
    """UnsafeUngripLabware command model."""

    commandType: UnsafeUngripLabwareCommandType = "unsafe/ungripLabware"
    params: UnsafeUngripLabwareParams
    result: Optional[UnsafeUngripLabwareResult]

    _ImplementationCls: Type[
        UnsafeUngripLabwareImplementation
    ] = UnsafeUngripLabwareImplementation


class UnsafeUngripLabwareCreate(BaseCommandCreate[UnsafeUngripLabwareParams]):
    """UnsafeEngageAxes command request model."""

    commandType: UnsafeUngripLabwareCommandType = "unsafe/ungripLabware"
    params: UnsafeUngripLabwareParams

    _CommandCls: Type[UnsafeUngripLabware] = UnsafeUngripLabware
