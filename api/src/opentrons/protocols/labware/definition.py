import logging
import json
import os
import shutil
from dataclasses import dataclass

from pathlib import Path
from typing import (
    Any, AnyStr, List, Dict, Union)

import jsonschema  # type: ignore

from opentrons.protocols.api_support.util import ModifiedList
from opentrons.calibration_storage import helpers, modify
from opentrons.protocols.implementations.interfaces.labware import \
    LabwareInterface
from opentrons.types import Point
from opentrons_shared_data import load_shared_data, get_shared_data_root
from opentrons.protocols.geometry.deck_item import DeckItem
from opentrons.protocols.api_support.constants import (
    OPENTRONS_NAMESPACE, CUSTOM_NAMESPACE, STANDARD_DEFS_PATH, USER_DEFS_PATH)
from opentrons_shared_data.labware.dev_types import LabwareDefinition


MODULE_LOG = logging.getLogger(__name__)


def get_labware_definition(
    load_name: str,
    namespace: str = None,
    version: int = None,
    bundled_defs: Dict[str, LabwareDefinition] = None,
    extra_defs: Dict[str, LabwareDefinition] = None
) -> LabwareDefinition:
    """
    Look up and return a definition by load_name + namespace + version and
        return it or raise an exception

    :param str load_name: corresponds to 'loadName' key in definition
    :param str namespace: The namespace the labware definition belongs to.
        If unspecified, will search 'opentrons' then 'custom_beta'
    :param int version: The version of the labware definition. If unspecified,
        will use version 1.
    :param bundled_defs: A bundle of labware definitions to exlusively use for
        finding labware definitions, if specified
    :param extra_defs: An extra set of definitions (in addition to the system
        definitions) in which to search
    """
    load_name = load_name.lower()

    if bundled_defs is not None:
        return _get_labware_definition_from_bundle(
            bundled_defs, load_name, namespace, version)

    checked_extras = extra_defs or {}

    try:
        return _get_labware_definition_from_bundle(
            checked_extras, load_name, namespace, version)
    except (FileNotFoundError, RuntimeError):
        pass

    return _get_standard_labware_definition(
        load_name, namespace, version)


def get_all_labware_definitions() -> List[str]:
    """
    Return a list of standard and custom labware definitions with load_name +
        name_space + version existing on the robot
    """
    labware_list = ModifiedList()

    def _check_for_subdirectories(path):
        with os.scandir(path) as top_path:
            for sub_dir in top_path:
                if sub_dir.is_dir():
                    labware_list.append(sub_dir.name)

    # check for standard labware
    _check_for_subdirectories(get_shared_data_root() / STANDARD_DEFS_PATH)

    # check for custom labware
    for namespace in os.scandir(USER_DEFS_PATH):
        _check_for_subdirectories(namespace)

    return labware_list


def save_definition(
    labware_def: LabwareDefinition,
    force: bool = False,
    location: Path = None
) -> None:
    """
    Save a labware definition

    :param labware_def: A deserialized JSON labware definition
    :param bool force: If true, overwrite an existing definition if found.
        Cannot overwrite Opentrons definitions.
    :param location: File path
    """
    namespace = labware_def['namespace']
    load_name = labware_def['parameters']['loadName']
    version = labware_def['version']

    verify_definition(labware_def)

    if not namespace or not load_name or not version:
        raise RuntimeError(
            'Could not save definition, labware def is missing a field: ' +
            f'{namespace}, {load_name}, {version}')

    if namespace == OPENTRONS_NAMESPACE:
        raise RuntimeError(
            f'Saving definitions to the "{OPENTRONS_NAMESPACE}" namespace ' +
            'is not permitted')

    def_path = _get_path_to_labware(load_name, namespace, version, location)

    if not force and def_path.is_file():
        raise RuntimeError(
            f'The given definition ({namespace}/{load_name} v{version}) ' +
            'already exists. Cannot save definition without force=True')

    Path(def_path).parent.mkdir(parents=True, exist_ok=True)
    with open(def_path, 'w') as f:
        json.dump(labware_def, f)


def verify_definition(contents: Union[
        AnyStr, LabwareDefinition, Dict[str, Any]])\
        -> LabwareDefinition:
    """ Verify that an input string is a labware definition and return it.

    If the definition is invalid, an exception is raised; otherwise parse the
    json and return the valid definition.

    :raises json.JsonDecodeError: If the definition is not valid json
    :raises jsonschema.ValidationError: If the definition is not valid.
    :returns: The parsed definition
    """
    schema_body = load_shared_data('labware/schemas/2.json').decode('utf-8')
    labware_schema_v2 = json.loads(schema_body)

    if isinstance(contents, dict):
        to_return = contents
    else:
        to_return = json.loads(contents)
    jsonschema.validate(to_return, labware_schema_v2)
    # we can type ignore this because if it passes the jsonschema it has
    # the correct structure
    return to_return  # type: ignore


def delete_all_custom_labware() -> None:
    """Delete all custom labware"""
    if USER_DEFS_PATH.is_dir():
        shutil.rmtree(USER_DEFS_PATH)


def save_calibration(
        labware: LabwareInterface,
        delta: Point) -> None:
    """Save a calibration"""
    index_info = IndexFileInformation.from_labware(labware)
    modify.save_labware_calibration(
        labware_path=index_info.path,
        definition=index_info.definition,
        delta=delta,
        parent=index_info.parent
    )
    labware.set_calibration(delta=delta)


def _get_labware_definition_from_bundle(
    bundled_labware: Dict[str, LabwareDefinition],
    load_name: str,
    namespace: str = None,
    version: int = None,
) -> LabwareDefinition:
    """
    Look up and return a bundled definition by ``load_name`` + ``namespace``
    + ``version`` and return it or raise an exception. The``namespace`` and
    ``version`` args are optional, they only have to be specified if there is
    ambiguity (eg when multiple labware in the bundle share the same
    ``load_name``)

    :param str load_name: corresponds to 'loadName' key in definition
    :param str namespace: The namespace the labware definition belongs to
    :param int version: The version of the labware definition
    :param Dict bundled_labware: A dictionary of labware definitions to search
    """
    load_name = load_name.lower()

    bundled_candidates = [
        b for b in bundled_labware.values()
        if b['parameters']['loadName'] == load_name]
    if namespace:
        namespace = namespace.lower()
        bundled_candidates = [
            b for b in bundled_candidates if b['namespace'] == namespace]
    if version:
        bundled_candidates = [
            b for b in bundled_candidates if b['version'] == version]

    if len(bundled_candidates) == 1:
        return bundled_candidates[0]
    elif len(bundled_candidates) > 1:
        raise RuntimeError(
            f'Ambiguous labware access. Bundle contains multiple '
            f'labware with load name {load_name}, '
            f'namespace {namespace}, and version {version}.')
    else:
        raise RuntimeError(
            f'No labware found in bundle with load name {load_name}, '
            f'namespace {namespace}, and version {version}.')


def _get_standard_labware_definition(
        load_name: str,
        namespace: str = None,
        version: int = None) -> LabwareDefinition:

    if version is None:
        checked_version = 1
    else:
        checked_version = version
    error_msg_string = """Unable to find a labware
        definition for "{0}",
        version {1}, in the {2} namespace.
        Please confirm your protocol includes the correct
        labware spelling and (optionally) the correct version
        number and namespace.

        If you are referencing a custom labware in your
        protocol, you must add it to your Custom Labware
        Definitions Folder from the Opentrons App before
        uploading your protocol.
        """

    if namespace is None:
        for fallback_namespace in [OPENTRONS_NAMESPACE, CUSTOM_NAMESPACE]:
            try:
                return _get_standard_labware_definition(
                    load_name, fallback_namespace, checked_version)
            except FileNotFoundError:
                pass

        raise FileNotFoundError(error_msg_string.format(
                load_name, checked_version, OPENTRONS_NAMESPACE))

    namespace = namespace.lower()
    def_path = _get_path_to_labware(load_name, namespace, checked_version)

    try:
        with open(def_path, 'rb') as f:
            labware_def = json.loads(f.read().decode('utf-8'))
    except FileNotFoundError:
        raise FileNotFoundError(
            f'Labware "{load_name}" not found with version {checked_version} '
            f'in namespace "{namespace}".'
        )

    return labware_def


def _get_parent_identifier(labware: LabwareInterface) -> str:
    """
    Helper function to return whether a labware is on top of a
    module or not.
    """
    parent = labware.get_geometry().parent.labware.object
    # TODO (lc, 07-14-2020): Once we implement calibrations per slot,
    # this function should either return a slot using `first_parent` or
    # the module it is attached to.
    if isinstance(parent, DeckItem) and parent.separate_calibration:
        # treat a given labware on a given module type as same
        return parent.load_name
    else:
        return ''  # treat all slots as same


def get_labware_hash(labware: LabwareInterface) -> str:
    return helpers.hash_labware_def(labware.get_definition())


def get_labware_hash_with_parent(labware: LabwareInterface) -> str:
    return helpers.hash_labware_def(
        labware.get_definition()
    ) + _get_parent_identifier(labware)


def _get_labware_path(labware: LabwareInterface) -> str:
    return f'{get_labware_hash_with_parent(labware)}.json'


@dataclass(frozen=True)
class IndexFileInformation:
    definition: LabwareDefinition
    parent: str
    path: str

    @classmethod
    def from_labware(cls, labware: LabwareInterface) -> 'IndexFileInformation':
        return IndexFileInformation(
            definition=labware.get_definition(),
            path=_get_labware_path(labware),
            parent=_get_parent_identifier(labware)
        )


def _get_path_to_labware(
        load_name: str, namespace: str, version: int, base_path: Path = None
        ) -> Path:
    if namespace == OPENTRONS_NAMESPACE:
        # all labware in OPENTRONS_NAMESPACE is stored in shared data
        return get_shared_data_root() / STANDARD_DEFS_PATH \
               / load_name / f'{version}.json'
    if not base_path:
        base_path = USER_DEFS_PATH
    def_path = base_path / namespace / load_name / f'{version}.json'
    return def_path
