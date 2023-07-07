""" opentrons.util.entrypoint_util: functions common to entrypoints
"""

from dataclasses import dataclass
import logging
from json import JSONDecodeError
import pathlib
import shutil
from typing import BinaryIO, Dict, Optional, Sequence, TextIO, Union, TYPE_CHECKING

from jsonschema import ValidationError  # type: ignore

from opentrons.protocol_api import labware
from opentrons.calibration_storage import helpers

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


# TODO(mm, 2023-06-29): Remove this hack when we fix https://opentrons.atlassian.net/browse/RSS-281.
def copy_file_like(source: Union[BinaryIO, TextIO], destination: pathlib.Path) -> None:
    """Copy a file-like object to a path, attempting to faithfully copy it byte-for-byte.

    If the source is text (not binary), this attempts to retrieve what its on-filesystem encoding
    originally was and save the new file with the same one.

    This is a hack to support this use case:

    1. A user has a Python source file with an unusual encoding.
       They have a matching encoding declaration at the top of the file.
       (https://docs.python.org/3.7/reference/lexical_analysis.html#encoding-declarations)
    2. They `open()` that file in text mode, with the correct encoding, and send the text stream to
       `opentrons.simulate.simulate()` or `opentrons.execute.execute()`.
    3. Because of temporary implementation cruft (https://opentrons.atlassian.net/browse/RSS-281),
       those functions sometimes need to save the stream to the filesystem, reopen it in
       *binary mode,* and parse it as bytes. When they do that, it's important that the new file's
       encoding matches the Python encoding declaration, or the Python parser will raise an error.
    """
    # When we read from the source stream, will it give us bytes, or text?
    source_is_text: bool
    # If the source stream is text, how was it originally encoded, if that's known?
    # If that's unknown or if the source stream is binary, this will be None.
    source_encoding: Optional[str]

    try:
        source_encoding = getattr(source, "encoding")
        source_is_text = True
    except AttributeError:
        source_encoding = None
        source_is_text = False

    # How should we open the destination file?
    destination_mode: str
    # With what encoding? (None if, and only if, we open it in binary mode.)
    destination_encoding: Optional[str]

    if source_is_text:
        destination_mode = "wt"
        # The encoding of a text source can be None (unknown) if it's an io.StringIO, for example.
        # If this happens, we need to make some arbitrary guess.
        #
        # UTF-8, not the system default, is the best choice, because:
        #   * It's Python's most common source encoding, and the default one when the source has
        #     no encoding declaration.
        #   * It's one of the encodings that `json.loads()` looks for.
        #
        # This will break if someone gives us an io.StringIO of a Python source that contains
        # an encoding declaration other than UTF-8.
        destination_encoding = source_encoding or "utf-8"
    else:
        destination_mode = "wb"
        destination_encoding = None

    with open(
        destination, mode=destination_mode, encoding=destination_encoding
    ) as destination_file:
        # Use copyfileobj() to limit memory usage.
        shutil.copyfileobj(fsrc=source, fdst=destination_file)
