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


RunProfileCommandType = Literal["thermocycler/runProfile"]


class AbsorbanceReadParams(BaseModel):
    """Input parameters for a single absorbance reading."""

    moduleId: str = Field(..., description="Unique ID of the Thermocycler.")
    sampleWavelength: float = Field(..., description="Sample wavelength in nm.")


class AbsorbanceReadResult(BaseModel):
    """Result data from running an aborbance reading."""

    data: List[float] = Field(..., description="Absorbance data points.")


class AbsorbanceReadImpl(AbstractCommandImpl[AbsorbanceReadParams, AbsorbanceReadResult]):
    """Execution implementation of a Thermocycler's run profile command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(self, params: AbsorbanceReadParams) -> AbsorbanceReadResult:
        """Initiate a single absorbance measurement."""
        # TODO: Implement this
        return AbsorbanceReadResult(data=[])


class AbsorbanceRead(BaseCommand[AbsorbanceReadParams, AbsorbanceReadResult]):
    """A command to execute a Thermocycler profile run."""

    # TODO: fix this
    commandType: AbsorbanceReadCommandType = "absorbanceReader/measure"
    params: AbsorbanceReadParams
    result: Optional[AbsorbanceReadResult]

    _ImplementationCls: Type[AbsorbanceReadImpl] = AbsorbanceReadImpl


class RunProfileCreate(BaseCommandCreate[AbsorbanceReadParams]):
    """A request to execute a Thermocycler profile run."""

    commandType: AbsorbanceReadCommandType = "absorbanceReader/measure"
    params: AbsorbanceReadParams

    _CommandCls: Type[AbsorbanceRead] = AbsorbanceRead
