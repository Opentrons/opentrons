"""Command models to read absorbance."""
from __future__ import annotations
from datetime import datetime
from typing import Optional, Dict, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors import CannotPerformModuleAction
from ...errors.error_occurrence import ErrorOccurrence

from ...resources.file_provider import PlateReaderDataTransform, ReadData
from ...resources import FileProvider

if TYPE_CHECKING:
    from opentrons.protocol_engine.state.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler


ReadAbsorbanceCommandType = Literal["absorbanceReader/read"]


class ReadAbsorbanceParams(BaseModel):
    """Input parameters for an absorbance reading."""

    moduleId: str = Field(..., description="Unique ID of the Absorbance Reader.")
    fileName: Optional[str] = Field(
        None,
        description="Optional file name to use when storing the results of a measurement.",
    )


class ReadAbsorbanceResult(BaseModel):
    """Result data from running an aborbance reading, returned as a dictionary map of wavelengths containing a map of values by well name (eg. {450: {"A1": 0.0, ...}})."""

    data: Optional[Dict[int, Dict[str, float]]] = Field(
        ..., description="Absorbance data points per wavelength."
    )


class ReadAbsorbanceImpl(
    AbstractCommandImpl[ReadAbsorbanceParams, SuccessData[ReadAbsorbanceResult, None]]
):
    """Execution implementation of an Absorbance Reader measurement."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        file_provider: FileProvider,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment
        self._file_provider = file_provider

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
            start_time = datetime.now()
            results = await abs_reader.start_measure()
            finish_time = datetime.now()
            if abs_reader._measurement_config is not None:
                asbsorbance_result: Dict[int, Dict[str, float]] = {}
                sample_wavelengths = abs_reader._measurement_config.sample_wavelengths
                transform_results = []
                for wavelength, result in zip(sample_wavelengths, results):
                    converted_values = (
                        self._state_view.modules.convert_absorbance_reader_data_points(
                            data=result
                        )
                    )
                    asbsorbance_result[wavelength] = converted_values
                    transform_results.append(
                        ReadData.build(wavelength=wavelength, data=converted_values)
                    )

                # Begin interfacing with the file provider if the user provided a filename
                if params.fileName is not None and abs_reader.serial_number is not None:
                    plate_read_result = PlateReaderDataTransform.build(
                        read_results=transform_results,
                        reference_wavelength=abs_reader_substate.reference_wavelength,
                        start_time=start_time,
                        finish_time=finish_time,
                        serial_number=abs_reader.serial_number,
                    )

                    if isinstance(plate_read_result, PlateReaderDataTransform):
                        # Write a CSV file for each of the measurements taken
                        for measurement in plate_read_result.read_results:
                            await self._file_provider.write_csv(
                                write_data=plate_read_result.build_generic_csv(
                                    filename=params.fileName,
                                    measurement=measurement,
                                )
                            )

                # Return success data to api
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
