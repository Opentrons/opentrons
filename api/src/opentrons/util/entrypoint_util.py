""" opentrons.util.entrypoint_util: functions common to entrypoints
"""

from dataclasses import dataclass
import logging
from json import JSONDecodeError
import pathlib
from typing import Dict, Sequence, Union, TYPE_CHECKING

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
