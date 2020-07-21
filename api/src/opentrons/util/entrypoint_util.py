""" opentrons.util.entrypoint_util: functions common to entrypoints
"""

import logging
from json import JSONDecodeError
import pathlib
from typing import Dict, List, TYPE_CHECKING

from jsonschema import ValidationError  # type: ignore

from opentrons.protocol_api import labware
from opentrons.calibration_storage import helpers

if TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition
log = logging.getLogger(__name__)


def labware_from_paths(paths: List[str]) -> Dict[str, 'LabwareDefinition']:
    labware_defs: Dict[str, 'LabwareDefinition'] = {}

    for strpath in paths:
        log.info(f"local labware: checking path {strpath}")
        purepath = pathlib.PurePath(strpath)
        if purepath.is_absolute():
            path = pathlib.Path(purepath)
        else:
            path = pathlib.Path.cwd() / purepath
        if not path.is_dir():
            raise RuntimeError(f'{path} is not a directory')
        for child in path.iterdir():
            if child.is_file() and child.suffix.endswith('json'):
                try:
                    defn = labware.verify_definition(child.read_bytes())
                except (ValidationError, JSONDecodeError) as e:
                    log.info(f"{child}: invalid labware, ignoring")
                    log.debug(f"{child}: labware invalid because: {str(e)}")
                else:
                    uri = helpers.uri_from_definition(defn)
                    labware_defs[uri] = defn
                    log.info(f'loaded labware {uri} from {child}')
            else:
                log.info(f'ignoring {child} in labware path')
    return labware_defs


def datafiles_from_paths(paths: List[str]) -> Dict[str, bytes]:
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
            log.info(f'read {path} into custom data as {path.name}')
        elif path.is_dir():
            for child in path.iterdir():
                if child.is_file():
                    datafiles[child.name] = child.read_bytes()
                    log.info(f'read {child} into data path as {child.name}')
                else:
                    log.info(f'ignoring {child} in data path')
    return datafiles
