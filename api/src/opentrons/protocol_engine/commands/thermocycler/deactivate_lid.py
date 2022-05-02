"""Command models to stop heating a Thermocycler's lid."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler


DeactivateLidCommandType = Literal["thermocycler/deactivateLid"]


class DeactivateLidParams(BaseModel):
    """Input parameters to unset a Thermocycler's target lid temperature."""

    moduleId: str = Field(..., description="Unique ID of the Thermocycler.")


class DeactivateLidResult(BaseModel):
    """Result data from unsetting a Thermocycler's target lid temperature."""


class DeactivateLidImpl(AbstractCommandImpl[DeactivateLidParams, DeactivateLidResult]):
    """Execution implementation of a Thermocycler's deactivate lid command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(self, params: DeactivateLidParams) -> DeactivateLidResult:
        """Unset a Thermocycler's target lid temperature."""
        raise NotImplementedError()


class DeactivateLid(BaseCommand[DeactivateLidParams, DeactivateLidResult]):
    """A command to unset a Thermocycler's target lid temperature."""

    commandType: DeactivateLidCommandType = "thermocycler/deactivateLid"
    params: DeactivateLidParams
    result: Optional[DeactivateLidResult]

    _ImplementationCls: Type[DeactivateLidImpl] = DeactivateLidImpl


class DeactivateLidCreate(BaseCommandCreate[DeactivateLidParams]):
    """A request to create a Thermocycler's deactivate lid command."""

    commandType: DeactivateLidCommandType
    params: DeactivateLidParams

    _CommandCls: Type[DeactivateLid] = DeactivateLid
