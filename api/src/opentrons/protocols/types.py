from typing import Any, Dict, NamedTuple, Optional, Union, TYPE_CHECKING
from .api_support.definitions import MIN_SUPPORTED_VERSION

if TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition
    from opentrons_shared_data.protocol.dev_types import (
        JsonProtocol as JsonProtocolDef
    )
    from .api_support.types import APIVersion

Metadata = Dict[str, Union[str, int]]


class JsonProtocol(NamedTuple):
    text: str
    filename: Optional[str]
    contents: 'JsonProtocolDef'
    schema_version: int
    api_level: 'APIVersion'


class PythonProtocol(NamedTuple):
    text: str
    filename: Optional[str]
    contents: Any  # This is the output of compile() which we can't type
    metadata: Metadata
    api_level: 'APIVersion'
    # these 'bundled_' attrs should only be included when the protocol is a zip
    bundled_labware: Optional[Dict[str, 'LabwareDefinition']]
    bundled_data: Optional[Dict[str, bytes]]
    bundled_python: Optional[Dict[str, str]]
    # this should only be included when the protocol is not a zip
    extra_labware: Optional[Dict[str, 'LabwareDefinition']]


Protocol = Union[JsonProtocol, PythonProtocol]


class BundleContents(NamedTuple):
    protocol: str
    bundled_labware: Dict[str, 'LabwareDefinition']
    bundled_data: Dict[str, bytes]
    bundled_python: Dict[str, str]


PROTOCOL_MALFORMED = """

A Python protocol for the OT2 must define a function called 'run' that takes a
single argument: the protocol context to call functions on. For instance, a run
function might look like this:

def run(ctx):
    ctx.comment('hello, world')

This function is called by the robot when the robot executes the protol.
This function is not present in the current protocol and must be added.
"""

PYTHON_API_VERSION_DEPRECATED = """

The python protocol you uploaded has the Python API Version {0}.  Robot server version 4.0.0 is
the official end of life of Python API Version {0}. The minimum supported Python API Version is {1}. This means that this protocol
will not run in robot server version 4.0.0 and above. 
Please downgrade your robot server version if you wish to run this protocol. Otherwise, please upgrade this
protocol to Python API Version {1} or above.

To upgrade your protocol to Python API Version {1} or above, please view our documentation at https://docs.opentrons.com/v2/index.html.

Please contact support@opentrons.com to retrieve the previous software version and be guided
through the downgrade process.

"""  # noqa E511


class MalformedProtocolError(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(message)

    def __str__(self):
        return self.message + PROTOCOL_MALFORMED

    def __repr__(self):
        return '<{}: {}>'.format(self.__class__.__name__, self.message)


class ApiDeprecationError(Exception):
    def __init__(self, version):
        self.version = version
        super().__init__(version)

    def __str__(self):
        return PYTHON_API_VERSION_DEPRECATED.format(
            self.version, MIN_SUPPORTED_VERSION)

    def __repr__(self):
        return '<{}: {}>'.format(self.__class__.__name__, self.version)
