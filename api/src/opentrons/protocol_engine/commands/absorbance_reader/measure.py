"""Command models to measure absorbance."""
from __future__ import annotations
from typing import List, Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler


MeasureAbsorbanceCommandType = Literal["absorbanceReader/measure"]


class MeasureAbsorbanceParams(BaseModel):
    """Input parameters for a single absorbance reading."""

    moduleId: str = Field(..., description="Unique ID of the Absorbance Reader.")
    sampleWavelength: int = Field(..., description="Sample wavelength in nm.")


class MeasureAbsorbanceResult(BaseModel):
    """Result data from running an aborbance reading."""

    # TODO: Transform this into a more complex model, such as a map with well names.
    data: Optional[List[float]] = Field(
        ..., min_items=96, max_items=96, description="Absorbance data points."
    )


class MeasureAbsorbanceImpl(
    AbstractCommandImpl[
        MeasureAbsorbanceParams, SuccessData[MeasureAbsorbanceResult, None]
    ]
):
    """Execution implementation of an Absorbance Reader measurement."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(
        self, params: MeasureAbsorbanceParams
    ) -> SuccessData[MeasureAbsorbanceResult, None]:
        """Initiate a single absorbance measurement."""
        abs_reader_substate = self._state_view.modules.get_absorbance_reader_substate(
            module_id=params.moduleId
        )
        # Allow propagation of ModuleNotAttachedError.
        abs_reader = self._equipment.get_module_hardware_api(
            abs_reader_substate.module_id
        )

        if abs_reader is not None:
            result = await abs_reader.start_measure(wavelength=params.sampleWavelength)
            return SuccessData(
                public=MeasureAbsorbanceResult(data=result),
                private=None,
            )

        return SuccessData(
            public=MeasureAbsorbanceResult(data=None),
            private=None,
        )


class MeasureAbsorbance(
    BaseCommand[MeasureAbsorbanceParams, MeasureAbsorbanceResult, ErrorOccurrence]
):
    """A command to execute an Absorbance Reader measurement."""

    commandType: MeasureAbsorbanceCommandType = "absorbanceReader/measure"
    params: MeasureAbsorbanceParams
    result: Optional[MeasureAbsorbanceResult]

    _ImplementationCls: Type[MeasureAbsorbanceImpl] = MeasureAbsorbanceImpl


class MeasureAbsorbanceCreate(BaseCommandCreate[MeasureAbsorbanceParams]):
    """A request to execute an Absorbance Reader measurement."""

    commandType: MeasureAbsorbanceCommandType = "absorbanceReader/measure"
    params: MeasureAbsorbanceParams

    _CommandCls: Type[MeasureAbsorbance] = MeasureAbsorbance
