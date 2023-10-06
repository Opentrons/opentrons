""" opentrons.util.entrypoint_util: functions common to entrypoints
"""

import asyncio
import contextlib
from dataclasses import dataclass
import logging
from json import JSONDecodeError
import pathlib
import shutil
import tempfile
from typing import (
    BinaryIO,
    Dict,
    Generator,
    List,
    Optional,
    Sequence,
    TextIO,
    Union,
    TYPE_CHECKING,
)

from jsonschema import ValidationError  # type: ignore

from opentrons.config import IS_ROBOT, JUPYTER_NOTEBOOK_LABWARE_DIR
from opentrons.protocol_api import labware
from opentrons.calibration_storage import helpers
from opentrons.protocol_engine.errors.error_occurrence import (
    ErrorOccurrence as ProtocolEngineErrorOccurrence,
)
from opentrons.protocol_reader import ProtocolReader, ProtocolSource

if TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition


log = logging.getLogger(__name__)


@dataclass
class FoundLabware:
    """An individual labware found by `labware_from_paths()`."""

    path: pathlib.Path
    definition: "LabwareDefinition"


def labware_from_paths(
    paths: Sequence[Union[str, pathlib.Path]]
) -> Dict[str, FoundLabware]:
    """Search paths for labware definitions.

    Returns:
        A dict, keyed by labware URI, where each value has the file path and the parsed def.
    """
    labware_defs: Dict[str, FoundLabware] = {}

    for strpath in paths:
        log.info(f"local labware: checking path {strpath}")
        purepath = pathlib.PurePath(strpath)
        if purepath.is_absolute():
            path = pathlib.Path(purepath)
        else:
            path = pathlib.Path.cwd() / purepath
        if not path.is_dir():
            raise RuntimeError(f"{path} is not a directory")
        for child in path.iterdir():
            if child.is_file() and child.suffix.endswith("json"):
                try:
                    defn = labware.verify_definition(child.read_bytes())
                except (ValidationError, JSONDecodeError):
                    log.info(f"{child}: invalid labware, ignoring")
                    log.debug(
                        f"{child}: labware invalid because of this exception.",
                        exc_info=True,
                    )
                else:
                    uri = helpers.uri_from_definition(defn)
                    labware_defs[uri] = FoundLabware(path=child, definition=defn)
                    log.info(f"loaded labware {uri} from {child}")
            else:
                log.info(f"ignoring {child} in labware path")
    return labware_defs


def find_jupyter_labware() -> Optional[Dict[str, FoundLabware]]:
    """Return labware files in this robot's Jupyter Notebook directory.

    Returns:
        If we're running on an Opentrons robot:
        A dict, keyed by labware URI, where each value has the file path and the parsed def.

        Otherwise: None.
    """
    if IS_ROBOT:
        # JUPYTER_NOTEBOOK_LABWARE_DIR should never be None when IS_ROBOT == True.
        assert JUPYTER_NOTEBOOK_LABWARE_DIR is not None
        if JUPYTER_NOTEBOOK_LABWARE_DIR.is_dir():
            return labware_from_paths([JUPYTER_NOTEBOOK_LABWARE_DIR])

    return None


def datafiles_from_paths(paths: Sequence[Union[str, pathlib.Path]]) -> Dict[str, bytes]:
    datafiles: Dict[str, bytes] = {}
    for strpath in paths:
        log.info(f"data files: checking path {strpath}")
        purepath = pathlib.PurePath(strpath)
        if purepath.is_absolute():
            path = pathlib.Path(purepath)
        else:
            path = pathlib.Path.cwd() / purepath
        if path.is_file():
            datafiles[path.name] = path.read_bytes()
            log.info(f"read {path} into custom data as {path.name}")
        elif path.is_dir():
            for child in path.iterdir():
                if child.is_file():
                    datafiles[child.name] = child.read_bytes()
                    log.info(f"read {child} into data path as {child.name}")
                else:
                    log.info(f"ignoring {child} in data path")
    return datafiles


# HACK(mm, 2023-06-29): This function is attempting to do something fundamentally wrong.
# Remove it when we fix https://opentrons.atlassian.net/browse/RSS-281.
def copy_file_like(source: Union[BinaryIO, TextIO], destination: pathlib.Path) -> None:
    """Copy a file-like object to a path.

    Limitations:
        If `source` is text, the new file's encoding may not correctly match its original encoding.
        This can matter if it's a Python file and it has an encoding declaration
        (https://docs.python.org/3.7/reference/lexical_analysis.html#encoding-declarations).
        Also, its newlines may get translated.
    """
    # When we read from the source stream, will it give us bytes, or text?
    try:
        # Experimentally, this is present (but possibly None) on text-mode streams,
        # and not present on binary-mode streams.
        getattr(source, "encoding")
    except AttributeError:
        source_is_text = False
    else:
        source_is_text = True

    if source_is_text:
        destination_mode = "wt"
    else:
        destination_mode = "wb"

    with open(
        destination,
        mode=destination_mode,
    ) as destination_file:
        # Use copyfileobj() to limit memory usage.
        shutil.copyfileobj(fsrc=source, fdst=destination_file)


@contextlib.contextmanager
def adapt_protocol_source(
    protocol_file: Union[BinaryIO, TextIO],
    protocol_name: str,
    extra_labware: Dict[str, FoundLabware],
) -> Generator[ProtocolSource, None, None]:
    """Create a `ProtocolSource` representing input protocol files."""
    with tempfile.TemporaryDirectory() as temporary_directory:
        # It's not well-defined in our customer-facing interfaces whether the supplied protocol_name
        # should be just the filename part, or a path with separators. In case it contains stuff
        # like "../", sanitize it to just the filename part so we don't save files somewhere bad.
        safe_protocol_name = pathlib.Path(protocol_name).name

        temp_protocol_file = pathlib.Path(temporary_directory) / safe_protocol_name

        # FIXME(mm, 2023-06-26): Copying this file is pure overhead, and it introduces encoding
        # hazards. Remove this when we can parse JSONv6+ and PAPIv2.14+ protocols without going
        # through the filesystem. https://opentrons.atlassian.net/browse/RSS-281
        copy_file_like(source=protocol_file, destination=temp_protocol_file)

        custom_labware_files = [labware.path for labware in extra_labware.values()]

        protocol_source = asyncio.run(
            ProtocolReader().read_saved(
                files=[temp_protocol_file] + custom_labware_files,
                directory=None,
                files_are_prevalidated=False,
            )
        )

        yield protocol_source


class ProtocolEngineExecuteError(Exception):
    def __init__(self, errors: List[ProtocolEngineErrorOccurrence]) -> None:
        """Raised when there was any fatal error running a protocol through Protocol Engine.

        Protocol Engine reports errors as data, not as exceptions.
        But the only way for `opentrons.execute.execute()` and `opentrons.simulate.simulate()`
        to signal problems to their callers is to raise something.
        So we need this class to wrap them.

        Params:
            errors: The errors that Protocol Engine reported.
        """
        # Show the full error details if this is part of a traceback. Don't try to summarize.
        super().__init__(errors)

        self._error_occurrences = errors

    def to_stderr_string(self) -> str:
        """Return a string suitable as the stderr output of the `opentrons_execute` CLI.

        This summarizes from the full error details.
        """
        # It's unclear what exactly we should extract here.
        #
        # First, do we print the first element, or the last, or all of them?
        #
        # Second, do we print the .detail? .errorCode? .errorInfo? .wrappedErrors?
        # By contract, .detail seems like it would be insufficient, but experimentally,
        # it includes a lot, like:
        #
        #     ProtocolEngineError [line 3]: Error 4000 GENERAL_ERROR (ProtocolEngineError):
        #     UnexpectedProtocolError: Labware "fixture_12_trough" not found with version 1
        #     in namespace "fixture".
        return self._error_occurrences[0].detail
