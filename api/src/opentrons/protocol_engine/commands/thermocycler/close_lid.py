"""Command models to close a Thermocycler's lid."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler


CloseLidCommandType = Literal["thermocycler/closeLid"]


class CloseLidParams(BaseModel):
    """Input parameters to close a Thermocycler's lid."""

    moduleId: str = Field(..., description="Unique ID of the Thermocycler.")


class CloseLidResult(BaseModel):
    """Result data from closing a Thermocycler's lid."""

    # TODO return lid status?


class CloseLidImpl(AbstractCommandImpl[CloseLidParams, CloseLidResult]):
    """Execution implementation of a Thermocycler's close lid command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(self, params: CloseLidParams) -> CloseLidResult:
        """Close a Thermocycler's lid."""
        thermocycler_state = self._state_view.modules.get_thermocycler_module_substate(
            params.moduleId
        )
        thermocycler_hardware = self._equipment.get_module_hardware_api(
            thermocycler_state.module_id
        )

        if thermocycler_hardware is not None:
            await thermocycler_hardware.close()

        return CloseLidResult()


class CloseLid(BaseCommand[CloseLidParams, CloseLidResult]):
    """A command to close a Thermocycler's lid."""

    commandType: CloseLidCommandType = "thermocycler/closeLid"
    params: CloseLidParams
    result: Optional[CloseLidResult]

    _ImplementationCls: Type[CloseLidImpl] = CloseLidImpl


class CloseLidCreate(BaseCommandCreate[CloseLidParams]):
    """A request to close a Thermocycler's lid."""

    commandType: CloseLidCommandType = "thermocycler/closeLid"
    params: CloseLidParams

    _CommandCls: Type[CloseLid] = CloseLid
