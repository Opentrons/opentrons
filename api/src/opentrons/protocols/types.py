from typing import Any, Dict, NamedTuple, Optional, Union

Metadata = Dict[str, Union[str, int]]


class JsonProtocol(NamedTuple):
    text: str
    filename: Optional[str]
    contents: Dict[str, Any]


class PythonProtocol(NamedTuple):
    text: str
    filename: Optional[str]
    contents: Any  # This is the output of compile() which we can't type
    metadata: Metadata
    api_level: str  # For now, should be '1' or '2'


Protocol = Union[JsonProtocol, PythonProtocol]
