"""Parameter context for python protocols."""
import uuid
from typing import List, Optional, Union, Dict

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import requires_version
from opentrons.protocols.parameters import (
    parameter_definition,
    csv_parameter_definition,
    validation,
)
from opentrons.protocols.parameters.types import (
    ParameterChoice,
    UserFacingTypes,
)
from opentrons.protocols.parameters.exceptions import (
    ParameterDefinitionError,
    ParameterValueError,
    IncompatibleParameterError,
)
from opentrons.protocol_engine.types import (
    RunTimeParameter,
    PrimitiveRunTimeParamValuesType,
    CSVRuntimeParamPaths,
    FileInfo,
)

from ._parameters import Parameters

_ParameterDefinitionTypes = Union[
    parameter_definition.ParameterDefinition,
    csv_parameter_definition.CSVParameterDefinition,
]


class ParameterContext:
    """Public context for adding parameters to a protocol."""

    def __init__(self, api_version: APIVersion) -> None:
        """Initializes a parameter context for user-set parameters."""
        self._api_version = api_version
        self._parameters: Dict[str, _ParameterDefinitionTypes] = {}

    def add_int(
        self,
        display_name: str,
        variable_name: str,
        default: int,
        minimum: Optional[int] = None,
        maximum: Optional[int] = None,
        choices: Optional[List[ParameterChoice]] = None,
        description: Optional[str] = None,
        unit: Optional[str] = None,
    ) -> None:
        """Creates an integer parameter, settable within a given range or list of choices.

        Arguments:
            display_name: The display name of the int parameter as it would show up on the frontend.
            variable_name: The variable name the int parameter will be referred to in the run context.
            default: The default value the int parameter will be set to. This will be used in initial analysis.
            minimum: The minimum value the int parameter can be set to (inclusive). Mutually exclusive with choices.
            maximum: The maximum value the int parameter can be set to (inclusive). Mutually exclusive with choices.
            choices: A list of possible choices that this parameter can be set to.
                Mutually exclusive with minimum and maximum.
            description: A description of the parameter as it will show up on the frontend.
            unit: An optional unit to be appended to the end of the integer as it shown on the frontend.
        """
        validation.validate_variable_name_unique(variable_name, set(self._parameters))
        parameter = parameter_definition.create_int_parameter(
            display_name=display_name,
            variable_name=variable_name,
            default=default,
            minimum=minimum,
            maximum=maximum,
            choices=choices,
            description=description,
            unit=unit,
        )
        self._parameters[parameter.variable_name] = parameter

    def add_float(
        self,
        display_name: str,
        variable_name: str,
        default: float,
        minimum: Optional[float] = None,
        maximum: Optional[float] = None,
        choices: Optional[List[ParameterChoice]] = None,
        description: Optional[str] = None,
        unit: Optional[str] = None,
    ) -> None:
        """Creates a float parameter, settable within a given range or list of choices.

        Arguments:
            display_name: The display name of the float parameter as it would show up on the frontend.
            variable_name: The variable name the float parameter will be referred to in the run context.
            default: The default value the float parameter will be set to. This will be used in initial analysis.
            minimum: The minimum value the float parameter can be set to (inclusive). Mutually exclusive with choices.
            maximum: The maximum value the float parameter can be set to (inclusive). Mutually exclusive with choices.
            choices: A list of possible choices that this parameter can be set to.
                Mutually exclusive with minimum and maximum.
            description: A description of the parameter as it will show up on the frontend.
            unit: An optional unit to be appended to the end of the float as it shown on the frontend.
        """
        validation.validate_variable_name_unique(variable_name, set(self._parameters))
        parameter = parameter_definition.create_float_parameter(
            display_name=display_name,
            variable_name=variable_name,
            default=validation.ensure_float_value(default),
            minimum=validation.ensure_optional_float_value(minimum),
            maximum=validation.ensure_optional_float_value(maximum),
            choices=validation.ensure_float_choices(choices),
            description=description,
            unit=unit,
        )
        self._parameters[parameter.variable_name] = parameter

    def add_bool(
        self,
        display_name: str,
        variable_name: str,
        default: bool,
        description: Optional[str] = None,
    ) -> None:
        """Creates a boolean parameter with allowable values of "On" (True) or "Off" (False).

        Arguments:
            display_name: The display name of the boolean parameter as it would show up on the frontend.
            variable_name: The variable name the boolean parameter will be referred to in the run context.
            default: The default value the boolean parameter will be set to. This will be used in initial analysis.
            description: A description of the parameter as it will show up on the frontend.
        """
        validation.validate_variable_name_unique(variable_name, set(self._parameters))
        parameter = parameter_definition.create_bool_parameter(
            display_name=display_name,
            variable_name=variable_name,
            default=default,
            choices=[
                {"display_name": "On", "value": True},
                {"display_name": "Off", "value": False},
            ],
            description=description,
        )
        self._parameters[parameter.variable_name] = parameter

    def add_str(
        self,
        display_name: str,
        variable_name: str,
        default: str,
        choices: Optional[List[ParameterChoice]] = None,
        description: Optional[str] = None,
    ) -> None:
        """Creates a string parameter, settable among given choices.

        Arguments:
            display_name: The display name of the string parameter as it would show up on the frontend.
            variable_name: The variable name the string parameter will be referred to in the run context.
            default: The default value the string parameter will be set to. This will be used in initial analysis.
            choices: A list of possible choices that this parameter can be set to.
                Mutually exclusive with minimum and maximum.
            description: A description of the parameter as it will show up on the frontend.
        """
        validation.validate_variable_name_unique(variable_name, set(self._parameters))
        parameter = parameter_definition.create_str_parameter(
            display_name=display_name,
            variable_name=variable_name,
            default=default,
            choices=choices,
            description=description,
        )
        self._parameters[parameter.variable_name] = parameter

    @requires_version(2, 20)
    def add_csv_file(
        self,
        display_name: str,
        variable_name: str,
        description: Optional[str] = None,
    ) -> None:
        """Creates a CSV parameter that can be set to any CSV file via the Flex ODD or a local computer.

        Arguments:
            display_name: The display name of the CSV parameter as it would show up on the frontend.
            variable_name: The variable name the CSV parameter will be referred to in the run context.
            description: A description of the parameter as it will show up on the frontend.
        """
        if any(
            isinstance(parameter, csv_parameter_definition.CSVParameterDefinition)
            for parameter in self._parameters.values()
        ):
            raise IncompatibleParameterError(
                "Only one CSV File parameter can be defined per protocol."
            )

        validation.validate_variable_name_unique(variable_name, set(self._parameters))
        parameter = csv_parameter_definition.create_csv_parameter(
            display_name=display_name,
            variable_name=variable_name,
            description=description,
        )
        self._parameters[parameter.variable_name] = parameter

    def set_parameters(
        self, parameter_overrides: PrimitiveRunTimeParamValuesType
    ) -> None:
        """Sets parameters to values given by client, validating them as well.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        for variable_name, override_value in parameter_overrides.items():
            try:
                parameter = self._parameters[variable_name]
            except KeyError:
                raise ParameterDefinitionError(
                    f"Parameter {variable_name} is not defined as a parameter for this protocol."
                )
            if isinstance(parameter, csv_parameter_definition.CSVParameterDefinition):
                raise ParameterValueError(
                    f"A primitive param value was provided for the parameter '{variable_name}',"
                    f" but '{variable_name}' is a CSV parameter that can only accept file IDs."
                )
            else:
                validated_value = validation.ensure_value_type(
                    override_value, parameter.parameter_type
                )
                parameter.value = validated_value

    def initialize_csv_files(
        self, run_time_param_file_overrides: CSVRuntimeParamPaths
    ) -> None:
        """Initializes the files for CSV parameters.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        for variable_name, file_path in run_time_param_file_overrides.items():
            try:
                parameter = self._parameters[variable_name]
            except KeyError:
                raise ParameterDefinitionError(
                    f"Parameter {variable_name} is not defined as a parameter for this protocol."
                )
            if not isinstance(
                parameter, csv_parameter_definition.CSVParameterDefinition
            ):
                raise ParameterValueError(
                    f"File Id was provided for the parameter '{variable_name}',"
                    f" but '{variable_name}' is not a CSV parameter."
                )

            # TODO(jbl 2024-09-30) Refactor this so file ID is passed as its own argument and not assumed from the path
            # If this is running on a robot, the parent folder in the path will be the file ID
            # If it is running locally, most likely the parent folder will not be a UUID, so instead we will change
            # this to be an empty string
            file_id = file_path.parent.name
            try:
                uuid.UUID(file_id, version=4)
            except ValueError:
                file_id = ""

            file_name = file_path.name

            with file_path.open("rb") as fh:
                contents = fh.read()

            parameter.file_info = FileInfo(id=file_id, name=file_name)
            parameter.value = contents

    def export_parameters_for_analysis(self) -> List[RunTimeParameter]:
        """Exports all parameters into a protocol engine models for reporting in analysis.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        return [
            parameter.as_protocol_engine_type()
            for parameter in self._parameters.values()
        ]

    def export_parameters_for_protocol(self) -> Parameters:
        """Exports all parameters into a protocol run usable parameters object.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        parameters_for_protocol: Dict[str, UserFacingTypes] = {}
        for parameter in self._parameters.values():
            value: UserFacingTypes
            if isinstance(parameter, csv_parameter_definition.CSVParameterDefinition):
                value = parameter.as_csv_parameter_interface(self._api_version)
            else:
                value = parameter.value
            parameters_for_protocol[parameter.variable_name] = value
        return Parameters(parameters=parameters_for_protocol)
