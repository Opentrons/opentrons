"""Command models to open the vent."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema
from typing_extensions import Literal, Type

from ...errors.error_occurrence import ErrorOccurrence
from ...state import update_types
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from opentrons.drivers.vacuum_module.types import VentState

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
    from opentrons.protocol_engine.state.state import StateView

OpenVentCommandType = Literal["vacuumModule/openVent"]


class OpenVentParams(BaseModel):
    """Input parameters to open the vent."""

    moduleId: str = Field(..., description="Unique ID of the vacuum module.")
    equalizeTimeout: int | SkipJsonSchema[None] = Field(
        None,
        description="Time in seconds to wait for pressure equalization after opening the vent. Does not wait if None.",
    )


class OpenVentResult(BaseModel):
    """Result data from opening the vent."""


class OpenVentImpl(AbstractCommandImpl[OpenVentParams, SuccessData[OpenVentResult]]):
    """Execution implementation of a open vent command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        movement: MovementHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment
        self._movement = movement

    async def execute(self, params: OpenVentParams) -> SuccessData[OpenVentResult]:
        """Open the vent."""
        state_update = update_types.StateUpdate()
        vm_state = self._state_view.modules.get_vacuum_module_substate(params.moduleId)
        vm_hardware = self._equipment.get_module_hardware_api(vm_state.module_id)
        if vm_hardware is not None:
            await vm_hardware.set_vent_state(vent_state=VentState.OPENED)
            if params.equalizeTimeout is not None:
                await vm_hardware.wait_for_pressure_equalization(params.equalizeTimeout)

        return SuccessData(public=OpenVentResult(), state_update=state_update)


class OpenVent(BaseCommand[OpenVentParams, OpenVentResult, ErrorOccurrence]):
    """A command to open the vent."""

    commandType: OpenVentCommandType = "vacuumModule/openVent"
    params: OpenVentParams
    result: Optional[OpenVentResult] = None

    _ImplementationCls: Type[OpenVentImpl] = OpenVentImpl


class OpenVentCreate(BaseCommandCreate[OpenVentParams]):
    """A request to open the vent."""

    commandType: OpenVentCommandType = "vacuumModule/openVent"
    params: OpenVentParams

    _CommandCls: Type[OpenVent] = OpenVent
