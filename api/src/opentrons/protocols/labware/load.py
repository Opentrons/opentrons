import logging
from typing import Dict

from opentrons.protocols.labware.definition import (
    IndexFileInformation, get_labware_definition)

from opentrons.calibration_storage import get
from opentrons.protocols.implementations.interfaces.labware import \
    LabwareInterface
from opentrons.protocols.implementations.labware import LabwareImplementation
from opentrons.types import Location
from opentrons_shared_data.labware.dev_types import LabwareDefinition


MODULE_LOG = logging.getLogger(__name__)


def load_from_definition(
        definition: LabwareDefinition,
        parent: Location,
        label: str = None) -> LabwareInterface:
    """
    Return a labware object constructed from a provided labware definition dict

    :param definition: A dict representing all required data for a labware,
        including metadata such as the display name of the labware, a
        definition of the order to iterate over wells, the shape of wells
        (shape, physical dimensions, etc), and so on. The correct shape of
        this definition is governed by the "labware-designer" project in
        the Opentrons/opentrons repo.
    :param parent: A :py:class:`.Location` representing the location where
                   the front and left most point of the outside of labware is
                   (often the front-left corner of a slot on the deck).
    :param str label: An optional label that will override the labware's
                      display name from its definition
    """
    labware = LabwareImplementation(
            definition=definition, parent=parent, label=label)
    index_info = IndexFileInformation.from_labware(labware)
    offset = get.get_labware_calibration(
        definition=index_info.definition,
        lookup_path=index_info.path,
        parent=index_info.parent)
    labware.set_calibration(offset)
    return labware


def load(
    load_name: str,
    parent: Location,
    label: str = None,
    namespace: str = None,
    version: int = 1,
    bundled_defs: Dict[str, LabwareDefinition] = None,
    extra_defs: Dict[str, LabwareDefinition] = None,
) -> LabwareInterface:
    """
    Return a labware object constructed from a labware definition dict looked
    up by name (definition must have been previously stored locally on the
    robot)

    :param load_name: A string to use for looking up a labware definition
        previously saved to disc. The definition file must have been saved in a
        known location
    :param parent: A :py:class:`.Location` representing the location where
                   the front and left most point of the outside of labware is
                   (often the front-left corner of a slot on the deck).
    :param str label: An optional label that will override the labware's
                      display name from its definition
    :param str namespace: The namespace the labware definition belongs to.
        If unspecified, will search 'opentrons' then 'custom_beta'
    :param int version: The version of the labware definition. If unspecified,
        will use version 1.
    :param bundled_defs: If specified, a mapping of labware names to labware
        definitions. Only the bundle will be searched for definitions.
    :param extra_defs: If specified, a mapping of labware names to labware
        definitions. If no bundle is passed, these definitions will also be
        searched.
    """
    definition = get_labware_definition(
        load_name, namespace, version,
        bundled_defs=bundled_defs,
        extra_defs=extra_defs)
    return load_from_definition(definition, parent, label)
