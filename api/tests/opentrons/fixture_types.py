"""Types for fixtures used in tests/opentrons/protocols."""
import io
from pathlib import Path
from typing import Any, Callable, Dict, NamedTuple, TextIO, Union, overload
from typing_extensions import Protocol as TypingProtocol, TypedDict, Literal

from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons_shared_data.protocol.dev_types import JsonProtocol


class Protocol(NamedTuple):
    """Protocol fixture."""

    text: str
    filename: str
    filelike: TextIO


class Bundle(TypedDict):
    """Bundled protocol fixture (no longer used in production)."""

    source_dir: Path
    filename: str
    contents: str
    filelike: io.BytesIO
    binary_zipfile: bytes
    metadata: Dict[str, str]
    bundled_data: Dict[str, str]
    bundled_labware: Dict[str, LabwareDefinition]
    bundled_python: Dict[str, Any]


BundleFixtureGetter = Callable[[str], Bundle]


class JsonProtocolFixtureGetter(TypingProtocol):
    """JSON protocol fixture getter definition.

    Defined as a typing.Protocol due to overloads and named arguments in usage.
    """

    @overload
    def __call__(
        self, fixture_version: str, fixture_name: str, decode: Literal[True] = True
    ) -> JsonProtocol:
        ...

    @overload
    def __call__(
        self,
        fixture_version: str,
        fixture_name: str,
        decode: Literal[False],
    ) -> str:
        ...

    def __call__(
        self,
        fixture_version: str,
        fixture_name: str,
        decode: bool = True,
    ) -> Union[str, JsonProtocol]:
        """Get a JSON protocol fixture."""
        ...
