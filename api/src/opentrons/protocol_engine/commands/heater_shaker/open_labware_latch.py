"""Command models to open the Heater-Shaker Module's labware latch."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler

OpenLabwareLatchCommandType = Literal["heaterShaker/openLabwareLatch"]


class OpenLabwareLatchParams(BaseModel):
    """Input parameters to open a Heater-Shaker Module's labware latch."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")


class OpenLabwareLatchResult(BaseModel):
    """Result data from opening a Heater-Shaker's labware latch."""


class OpenLabwareLatchImpl(
    AbstractCommandImpl[OpenLabwareLatchParams, OpenLabwareLatchResult]
):
    """Execution implementation of a Heater-Shaker's open latch labware command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(self, params: OpenLabwareLatchParams) -> OpenLabwareLatchResult:
        """Open a Heater-Shaker's labware latch."""
        # Allow propagation of ModuleNotLoadedError and WrongModuleTypeError.
        hs_module_substate = self._state_view.modules.get_heater_shaker_module_substate(
            module_id=params.moduleId
        )

        # Allow propagation of ModuleNotAttachedError.
        hs_hardware_module = self._equipment.get_module_hardware_api(
            hs_module_substate.module_id
        )

        if hs_hardware_module is not None:
            await hs_hardware_module.open_labware_latch()

        return OpenLabwareLatchResult()


class OpenLabwareLatch(BaseCommand[OpenLabwareLatchParams, OpenLabwareLatchResult]):
    """A command to open a Heater-Shaker's labware latch."""

    commandType: OpenLabwareLatchCommandType = "heaterShaker/openLabwareLatch"
    params: OpenLabwareLatchParams
    result: Optional[OpenLabwareLatchResult]

    _ImplementationCls: Type[OpenLabwareLatchImpl] = OpenLabwareLatchImpl


class OpenLabwareLatchCreate(BaseCommandCreate[OpenLabwareLatchParams]):
    """A request to create a Heater-Shaker's open labware latch command."""

    commandType: OpenLabwareLatchCommandType
    params: OpenLabwareLatchParams

    _CommandCls: Type[OpenLabwareLatch] = OpenLabwareLatch
