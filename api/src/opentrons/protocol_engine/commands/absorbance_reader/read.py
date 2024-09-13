"""Command models to read absorbance."""
from __future__ import annotations
from typing import Optional, Dict, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors import CannotPerformModuleAction
from ...errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from opentrons.protocol_engine.state.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler


ReadAbsorbanceCommandType = Literal["absorbanceReader/read"]


class ReadAbsorbanceParams(BaseModel):
    """Input parameters for an absorbance reading."""

    moduleId: str = Field(..., description="Unique ID of the Absorbance Reader.")


class ReadAbsorbanceResult(BaseModel):
    """Result data from running an aborbance reading, returned as a dictionary map of values by well name (eg. ("A1": 0.0, ...))."""

    # TODO: change description and return type

    # data: Optional[Dict[str, float]] = Field(..., description="Absorbance data points.")
    data: Optional[Dict[int, Dict[str, float]]] = Field(
        ..., description="Absorbance data points."
    )


class ReadAbsorbanceImpl(
    AbstractCommandImpl[ReadAbsorbanceParams, SuccessData[ReadAbsorbanceResult, None]]
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
        self, params: ReadAbsorbanceParams
    ) -> SuccessData[ReadAbsorbanceResult, None]:
        """Initiate an absorbance measurement."""
        abs_reader_substate = self._state_view.modules.get_absorbance_reader_substate(
            module_id=params.moduleId
        )
        # Allow propagation of ModuleNotAttachedError.
        abs_reader = self._equipment.get_module_hardware_api(
            abs_reader_substate.module_id
        )

        if abs_reader_substate.configured is False:
            raise CannotPerformModuleAction(
                "Cannot perform Read action on Absorbance Reader without calling `.initialize(...)` first."
            )

        if abs_reader is not None:
            results = await abs_reader.start_measure()
            if abs_reader._measurement_config is not None:
                asbsorbance_result: Dict[int, Dict[str, float]] = {}
                sample_wavelengths = abs_reader._measurement_config.sample_wavelengths
                for wavelength, result in zip(sample_wavelengths, results):
                    converted_values = (
                        self._state_view.modules.convert_absorbance_reader_data_points(
                            data=result
                        )
                    )
                    asbsorbance_result[wavelength] = converted_values
                return SuccessData(
                    public=ReadAbsorbanceResult(data=asbsorbance_result),
                    private=None,
                )

        return SuccessData(
            public=ReadAbsorbanceResult(data=None),
            private=None,
        )


class ReadAbsorbance(
    BaseCommand[ReadAbsorbanceParams, ReadAbsorbanceResult, ErrorOccurrence]
):
    """A command to execute an Absorbance Reader measurement."""

    commandType: ReadAbsorbanceCommandType = "absorbanceReader/read"
    params: ReadAbsorbanceParams
    result: Optional[ReadAbsorbanceResult]

    _ImplementationCls: Type[ReadAbsorbanceImpl] = ReadAbsorbanceImpl


class ReadAbsorbanceCreate(BaseCommandCreate[ReadAbsorbanceParams]):
    """A request to execute an Absorbance Reader measurement."""

    commandType: ReadAbsorbanceCommandType = "absorbanceReader/read"
    params: ReadAbsorbanceParams

    _CommandCls: Type[ReadAbsorbance] = ReadAbsorbance
