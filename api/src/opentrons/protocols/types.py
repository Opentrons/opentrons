from typing import Any, Dict, NamedTuple, Optional, Union, TYPE_CHECKING
from dataclasses import dataclass

from opentrons_shared_data.robot.dev_types import RobotType
from .api_support.definitions import MIN_SUPPORTED_VERSION
from .api_support.types import APIVersion

if TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition
    from opentrons_shared_data.protocol.dev_types import (
        JsonProtocol as JsonProtocolDef,
        Metadata as JsonProtocolMetadata,
    )


PythonProtocolMetadata = Optional[Dict[str, str]]
"""The contents of a Python protocol's `metadata` dict, if there is one."""


PythonProtocolRequirements = Optional[Dict[str, str]]
"""The contents of a Python protocol's `requirements` dict, if there is one."""


@dataclass(frozen=True)
class StaticPythonInfo:
    """Information statically extracted from a Python Protocol API file."""

    metadata: PythonProtocolMetadata
    requirements: PythonProtocolRequirements


@dataclass(frozen=True)
class _ProtocolCommon:
    text: str
    filename: Optional[str]
    # TODO(mm, 2023-06-22): Move api_level out of _ProtocolCommon and into PythonProtocol.
    # JSON protocols do not have an intrinsic api_level, especially since JSONv6,
    # where they are no longer executed via the Python Protocol API.
    api_level: "APIVersion"
    robot_type: RobotType


@dataclass(frozen=True)
class JsonProtocol(_ProtocolCommon):
    schema_version: int
    contents: "JsonProtocolDef"
    metadata: "JsonProtocolMetadata"


@dataclass(frozen=True)
class PythonProtocol(_ProtocolCommon):
    contents: Any  # This is the output of compile() which we can't type
    metadata: PythonProtocolMetadata
    # these 'bundled_' attrs should only be included when the protocol is a zip
    bundled_labware: Optional[Dict[str, "LabwareDefinition"]]
    bundled_data: Optional[Dict[str, bytes]]
    bundled_python: Optional[Dict[str, str]]
    # this should only be included when the protocol is not a zip
    extra_labware: Optional[Dict[str, "LabwareDefinition"]]


Protocol = Union[JsonProtocol, PythonProtocol]


class BundleContents(NamedTuple):
    protocol: str
    bundled_labware: Dict[str, "LabwareDefinition"]
    bundled_data: Dict[str, bytes]
    bundled_python: Dict[str, str]


PROTOCOL_MALFORMED = """

A Python protocol for the OT2 must define a function called 'run' that takes a
single argument: the protocol context to call functions on. For instance, a run
function might look like this:

def run(ctx):
    ctx.comment('hello, world')

This function is called by the robot when the robot executes the protocol.
This function is not present in the current protocol and must be added.
"""

PYTHON_API_VERSION_DEPRECATED = """

The Python protocol you uploaded has the Python API Version {0}.  Robot server version 4.0.0 is
the official end of life of Python API Version {0}. The minimum supported Python API Version is {1}. This means that this protocol
will not run in robot server version 4.0.0 and above.
Please downgrade your robot server version if you wish to run this protocol. Otherwise, please upgrade this
protocol to Python API Version {1} or above.

To upgrade your protocol to Python API Version {1} or above, please view our documentation at https://docs.opentrons.com/v2/index.html.

Please contact support@opentrons.com to retrieve the previous software version and be guided
through the downgrade process.

"""


class MalformedProtocolError(Exception):
    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)

    def __str__(self) -> str:
        return self.message + PROTOCOL_MALFORMED

    def __repr__(self) -> str:
        return "<{}: {}>".format(self.__class__.__name__, self.message)


class ApiDeprecationError(Exception):
    def __init__(self, version: APIVersion) -> None:
        self.version = version
        super().__init__(version)

    def __str__(self) -> str:
        return PYTHON_API_VERSION_DEPRECATED.format(self.version, MIN_SUPPORTED_VERSION)

    def __repr__(self) -> str:
        return "<{}: {}>".format(self.__class__.__name__, self.version)
