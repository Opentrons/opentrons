from typing import Any, Dict, NamedTuple, Optional, Union, TYPE_CHECKING

if TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition
    from opentrons_shared_data.protocol.dev_types import (
        JsonProtocol as JsonProtocolDef
    )

Metadata = Dict[str, Union[str, int]]


class APIVersion(NamedTuple):
    major: int
    minor: int

    @classmethod
    def from_string(cls, inp: str) -> 'APIVersion':
        parts = inp.split('.')
        if len(parts) != 2:
            raise ValueError(inp)
        intparts = [int(p) for p in parts]

        return cls(major=intparts[0], minor=intparts[1])

    def __str__(self):
        return f'{self.major}.{self.minor}'


class JsonProtocol(NamedTuple):
    text: str
    filename: Optional[str]
    contents: 'JsonProtocolDef'
    schema_version: int


class PythonProtocol(NamedTuple):
    text: str
    filename: Optional[str]
    contents: Any  # This is the output of compile() which we can't type
    metadata: Metadata
    api_level: APIVersion
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


class MalformedProtocolError(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(message)

    def __str__(self):
        return self.message + PROTOCOL_MALFORMED

    def __repr__(self):
        return '<{}: {}>'.format(self.__class__.__name__, self.message)
