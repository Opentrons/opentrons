"""Input file config analysis."""
import ast
from dataclasses import dataclass
from typing import Union
from typing_extensions import Literal

from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION
from opentrons.protocols.parse import (
    extract_static_python_info,
    version_from_static_python_info,
)
from opentrons.protocols.types import StaticPythonInfo
from opentrons.protocols.models import JsonProtocol as ProtocolSchemaV5
from opentrons_shared_data.protocol.models import ProtocolSchemaV6

from .protocol_source import Metadata, PythonProtocolConfig, JsonProtocolConfig
from .role_analyzer import RoleAnalysisFile


@dataclass(frozen=True)
class ConfigAnalysis:
    """Protocol config analyzed from main file."""

    metadata: Metadata
    # TODO(mm, 2022-10-21): Make robot_type an enum when we figure out where it should
    # live.
    robot_type: Literal["OT-2 Standard", "OT-3 Standard"]
    config: Union[PythonProtocolConfig, JsonProtocolConfig]


class ConfigAnalysisError(ValueError):
    """Error raised if protocol config can not be determined."""


class ConfigAnalyzer:
    """Input file config analysis interface."""

    @staticmethod
    def analyze(main_file: RoleAnalysisFile) -> ConfigAnalysis:
        """Analyze the main file of a protocol to identify its config and metadata."""
        if isinstance(main_file.data, (ProtocolSchemaV5, ProtocolSchemaV6)):
            return ConfigAnalysis(
                metadata=main_file.data.metadata.dict(exclude_none=True),
                robot_type=main_file.data.robot.model,
                config=JsonProtocolConfig(
                    schema_version=main_file.data.schemaVersion,
                ),
            )

        else:
            return _analyze_python(main_file)


# todo(mm, 2021-09-13): This duplicates opentrons.protocols.parse.parse()
# and misses some of its functionality. For example, this misses looking at import
# statements to see if a protocol looks like APIv1, and this misses statically
# validating the structure of an APIv2 protocol to make sure it has exactly 1 run()
# function, etc.
def _analyze_python(main_file: RoleAnalysisFile) -> ConfigAnalysis:
    assert main_file.name.lower().endswith(".py"), "Expected main_file to be Python"

    try:
        # todo(mm, 2021-09-13): Investigate whether it's really appropriate to leave
        # the Python compilation flags at their defaults. For example, we probably
        # don't truly want the protocol to inherit our own __future__ features.
        module_ast = ast.parse(source=main_file.contents, filename=main_file.name)
    except (SyntaxError, ValueError) as e:
        # ast.parse() raises SyntaxError for most errors,
        # but ValueError if the source contains null bytes.
        raise ConfigAnalysisError(f"Unable to parse {main_file.name}.") from e

    try:
        static_info = extract_static_python_info(module_ast)
    except ValueError as e:
        raise ConfigAnalysisError(
            f"Unable to extract metadata from {main_file.name}."
        ) from e

    try:
        api_version = version_from_static_python_info(static_info)
    except ValueError as e:
        raise ConfigAnalysisError(str(e)) from e
    if api_version is None:
        raise ConfigAnalysisError(f"apiLevel not declared in {main_file.name}")
    if api_version > MAX_SUPPORTED_VERSION:
        raise ConfigAnalysisError(
            f"API version {api_version} is not supported by this "
            f"robot software. Please either reduce your requested API "
            f"version or update your robot."
        )

    robot_type = _robot_type_from_static_python_info(static_info)

    return ConfigAnalysis(
        metadata=static_info.metadata or {},
        robot_type=robot_type,
        config=PythonProtocolConfig(api_version=api_version),
    )


def _robot_type_from_static_python_info(
    static_python_info: StaticPythonInfo,
) -> Literal["OT-2 Standard", "OT-3 Standard"]:
    python_robot_type = (static_python_info.requirements or {}).get("robotType", None)
    if python_robot_type in (None, "OT-2"):
        return "OT-2 Standard"
    elif python_robot_type == "OT-3":
        return "OT-3 Standard"
    else:
        raise ConfigAnalysisError(
            f"robotType must be 'OT-2' or 'OT-3', not {repr(python_robot_type)}."
        )
