"""Command models to execute a Thermocycler profile."""
from __future__ import annotations
from typing import List, Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from opentrons.hardware_control.modules.types import ThermocyclerStep

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler


AbsorbanceMeasureCommandType = Literal["absorbanceReader/measure"]


class AbsorbanceMeasureParams(BaseModel):
    """Input parameters for a single absorbance reading."""

    moduleId: str = Field(..., description="Unique ID of the Thermocycler.")
    sampleWavelength: float = Field(..., description="Sample wavelength in nm.")


class AbsorbanceMeasureResult(BaseModel):
    """Result data from running an aborbance reading."""

    data: List[float] = Field(..., description="Absorbance data points.")


class AbsorbanceMeasureImpl(
    AbstractCommandImpl[AbsorbanceMeasureParams, AbsorbanceMeasureResult]
):
    """Execution implementation of a Thermocycler's run profile command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(self, params: AbsorbanceMeasureParams) -> AbsorbanceMeasureResult:
        """Initiate a single absorbance measurement."""
        abs_reader_substate = self._state_view.modules.get_absorbance_reader_substate(
            module_id=params.moduleId
        )
        # Allow propagation of ModuleNotAttachedError.
        abs_reader = self._equipment.get_module_hardware_api(
            abs_reader_substate.module_id
        )
        return AbsorbanceMeasureResult(data=[])


class AbsorbanceMeasure(BaseCommand[AbsorbanceMeasureParams, AbsorbanceMeasureResult]):
    """A command to execute an Absorbance Reader measurement."""

    commandType: AbsorbanceMeasureCommandType = "absorbanceReader/measure"
    params: AbsorbanceMeasureParams
    result: Optional[AbsorbanceMeasureResult]

    _ImplementationCls: Type[AbsorbanceMeasureImpl] = AbsorbanceMeasureImpl


class AbsorbanceMeasureCreate(BaseCommandCreate[AbsorbanceMeasureParams]):
    """A request to execute an Absorbance Reader measurement."""

    commandType: AbsorbanceMeasureCommandType = "absorbanceReader/measure"
    params: AbsorbanceMeasureParams

    _CommandCls: Type[AbsorbanceMeasure] = AbsorbanceMeasure
