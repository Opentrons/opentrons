""" opentrons.protocol_api.module_geometry: classes and functions for modules
as deck objects

This module provides things like :py:class:`ModuleGeometry` and
:py:func:`load_module` to create and manipulate module objects as geometric
objects on the deck (as opposed to calling commands on them, which is handled
by :py:mod:`.module_contexts`)
"""

import json
from typing import Any, Dict, Optional, Union

from opentrons.system.shared_data import load_shared_data
from opentrons.types import Location, Point
from opentrons.protocols.types import APIVersion
from .definitions import MAX_SUPPORTED_VERSION, DeckItem
from .labware import Labware


ModuleDefinitionV1 = Dict[str, Any]
ModuleDefinitionV2 = Dict[str, Any]
ModuleDefinition = Union[ModuleDefinitionV1, ModuleDefinitionV2]


class NoSuchModuleError(Exception):
    def __init__(self, message: str, requested_module: str) -> None:
        self.message = message
        self.requested_module = requested_module
        super().__init__()

    def __str__(self) -> str:
        return self.message


class ModuleGeometry(DeckItem):
    """
    This class represents an active peripheral, such as an Opentrons Magnetic
    Module, Temperature Module or Thermocycler Module. It defines the physical
    geometry of the device (primarily the offset that modifies the position of
    the labware mounted on top of it).
    """

    @classmethod
    def resolve_module_name(cls, module_name: str):
        alias_map = {
            'magdeck': 'magdeck',
            'magnetic module': 'magdeck',
            'tempdeck': 'tempdeck',
            'temperature module': 'tempdeck',
            'thermocycler': 'thermocycler',
            'thermocycler module': 'thermocycler'
        }
        lower_name = module_name.lower()
        resolved_name = alias_map.get(lower_name, None)
        if not resolved_name:
            raise ValueError(f'{module_name} is not a valid module load name')
        return resolved_name

    @property
    def disambiguate_calibration(self) -> bool:
        # If a module is the parent of a labware it affects calibration
        return True

    def __init__(self,
                 definition: dict,
                 parent: Location,
                 api_level: APIVersion = None) -> None:
        """
        Create a Module for tracking the position of a module.

        Note that modules do not currently have a concept of calibration apart
        from calibration of labware on top of the module. The practical result
        of this is that if the module parent :py:class:`.Location` is
        incorrect, then acorrect calibration of one labware on the deck would
        be incorrect on the module, and vice-versa. Currently, the way around
        this would be to correct the :py:class:`.Location` so that the
        calibrated labware is targeted accurately in both positions.

        :param definition: A dict containing all the data required to define
                           the geometry of the module.
        :type definition: dict
        :param parent: A location representing location of the front left of
                       the outside of the module (usually the front-left corner
                       of a slot on the deck).
        :type parent: :py:class:`.Location`
        :param APIVersion api_level: the API version to set for the loaded
                                     :py:class:`ModuleGeometry` instance. The
                                     :py:class:`ModuleGeometry` will
                                     conform to this level. If not specified,
                                     defaults to
                                     :py:attr:`.MAX_SUPPORTED_VERSION`.
        """
        if not api_level:
            api_level = MAX_SUPPORTED_VERSION
        if api_level > MAX_SUPPORTED_VERSION:
            raise RuntimeError(
                f'API version {api_level} is not supported by this '
                f'robot software. Please either reduce your requested API '
                f'version or update your robot.')
        self._api_version = api_level
        self._parent = parent
        self._display_name = "{} on {}".format(definition["displayName"],
                                               str(parent.labware))
        self._load_name = definition["loadName"]
        self._offset = Point(definition["labwareOffset"]["x"],
                             definition["labwareOffset"]["y"],
                             definition["labwareOffset"]["z"])
        self._height = definition["dimensions"]["bareOverallHeight"]\
            + self._parent.point.z
        self._over_labware = definition["dimensions"]["overLabwareHeight"]
        self._labware: Optional[Labware] = None
        self._location = Location(
            point=self._offset + self._parent.point,
            labware=self)

    @property
    def api_version(self) -> APIVersion:
        return self._api_version

    def add_labware(self, labware: Labware) -> Labware:
        assert not self._labware,\
            '{} is already on this module'.format(self._labware)
        self._labware = labware
        return self._labware

    def reset_labware(self):
        self._labware = None

    @property
    def load_name(self):
        return self._load_name

    @property
    def parent(self):
        return self._parent.labware

    @property
    def labware(self) -> Optional[Labware]:
        return self._labware

    @property
    def location(self) -> Location:
        """
        :return: a :py:class:`.Location` representing the top of the module
        """
        return self._location

    @property
    def labware_offset(self) -> Point:
        """
        :return: a :py:class:`.Point` representing the transformation
        between the critical point of the module and the critical
        point of its contained labware
        """
        return self._offset

    @property
    def highest_z(self) -> float:
        if self.labware:
            return self.labware.highest_z + self._over_labware
        else:
            return self._height

    def __repr__(self):
        return self._display_name


class ThermocyclerGeometry(ModuleGeometry):
    def __init__(self, definition: Dict[str, Any], parent: Location,
                 api_level: APIVersion = None) -> None:
        super().__init__(definition, parent, api_level)
        self._lid_height = definition["dimensions"]["lidHeight"]
        self._lid_status = 'open'   # Needs to reflect true status
        # TODO: BC 2019-07-25 add affordance for "semi" configuration offset
        # to be from a flag in context, according to drawings, the only
        # difference is -23.28mm in the x-axis

    @property
    def highest_z(self) -> float:
        # TODO: BC 2019-08-27 this highest_z value represents the distance
        # from the top of the open TC chassis to the base. Once we have a
        # more robust collision detection system in place, the collision
        # model for the TC should change based on it's lid_status
        # (open or closed). A prerequisite for that check will be
        # path-specific highest z calculations, as opposed to the current
        # global check on instrument.move_to. For example: a move from slot 1
        # to slot 3 should only check the highest z of all deck items between
        # the source and destination in the x,y plane.
        return super().highest_z

    @property
    def lid_status(self) -> str:
        return self._lid_status

    @lid_status.setter
    def lid_status(self, status) -> None:
        self._lid_status = status

    # NOTE: this func is unused until "semi" configuration
    def labware_accessor(self, labware: Labware) -> Labware:
        # Block first three columns from being accessed
        definition = labware._definition
        definition['ordering'] = definition['ordering'][3::]
        return Labware(
            definition, super().location, api_level=self._api_version)

    def add_labware(self, labware: Labware) -> Labware:
        assert not self._labware,\
            '{} is already on this module'.format(self._labware)
        assert self.lid_status != 'closed', \
            'Cannot place labware in closed module'
        self._labware = labware
        return self._labware


def load_module_from_definition(
        definition: Dict[str, Any],
        parent: Location,
        api_level: APIVersion = None) -> ModuleGeometry:
    """
    Return a :py:class:`ModuleGeometry` object from a specified definition
    matching the v1 module definition schema

    :param definition: A dict representing the full module definition adhering
                       to the v1 module schema
    :param parent: A :py:class:`.Location` representing the location where
                   the front and left most point of the outside of the module
                   is (often the front-left corner of a slot on the deck).
    :param APIVersion api_level: the API version to set for the loaded
                                 :py:class:`ModuleGeometry` instance. The
                                 :py:class:`ModuleGeometry` will
                                 conform to this level. If not specified,
                                 defaults to :py:attr:`.MAX_SUPPORTED_VERSION`.
    """
    api_level = api_level or MAX_SUPPORTED_VERSION
    mod_name = definition['loadName']

    if mod_name == 'thermocycler':
        mod: ModuleGeometry = \
                ThermocyclerGeometry(definition, parent, api_level)
    else:
        mod = ModuleGeometry(definition, parent, api_level)
    # TODO: calibration
    return mod


def _load_module_definition(api_level: APIVersion) -> Dict[str, Any]:
    """
    Load the appropriate module definition for this api version
    """
    return json.loads(load_shared_data('module/definitions/1.json'))


def load_module(
        name: str,
        parent: Location,
        api_level: APIVersion = None) -> ModuleGeometry:
    """
    Return a :py:class:`ModuleGeometry` object from a definition looked up
    by name.

    :param name: A string to use for looking up the definition. The string
                 must be present as a top-level key in
                 module/definitions/{moduleDefinitionVersion}.json.
    :param parent: A :py:class:`.Location` representing the location where
                   the front and left most point of the outside of the module
                   is (often the front-left corner of a slot on the deck).
    :param APIVersion api_level: the API version to set for the loaded
                                 :py:class:`ModuleGeometry` instance. The
                                 :py:class:`ModuleGeometry` will
                                 conform to this level. If not specified,
                                 defaults to :py:attr:`.MAX_SUPPORTED_VERSION`.
    """
    api_level = api_level or MAX_SUPPORTED_VERSION
    defn = _load_module_definition(api_level)
    return load_module_from_definition(defn[name], parent, api_level)
