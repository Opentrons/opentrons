from typing import Any, Dict, NamedTuple, Optional, Union

Metadata = Dict[str, Union[str, int]]


class APIVersion(NamedTuple):
    major: int
    minor: int

    def __str__(self):
        return f'{self.major}.{self.minor}'


class JsonProtocol(NamedTuple):
    text: str
    filename: Optional[str]
    contents: Dict[str, Any]
    schema_version: int


class PythonProtocol(NamedTuple):
    text: str
    filename: Optional[str]
    contents: Any  # This is the output of compile() which we can't type
    metadata: Metadata
    api_level: APIVersion
    # these 'bundled_' attrs should only be included when the protocol is a zip
    bundled_labware: Optional[Dict[str, Dict[str, Any]]]
    bundled_data: Optional[Dict[str, bytes]]
    bundled_python: Optional[Dict[str, str]]
    # this should only be included when the protocol is not a zip
    extra_labware: Optional[Dict[str, Dict[str, Any]]]


Protocol = Union[JsonProtocol, PythonProtocol]


class BundleContents(NamedTuple):
    protocol: str
    bundled_labware: Dict[str, Dict[str, Any]]
    bundled_data: Dict[str, bytes]
    bundled_python: Dict[str, str]
