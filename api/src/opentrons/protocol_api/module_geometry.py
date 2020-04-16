""" opentrons.protocol_api.module_geometry: classes and functions for modules
as deck objects

This module provides things like :py:class:`ModuleGeometry` and
:py:func:`load_module` to create and manipulate module objects as geometric
objects on the deck (as opposed to calling commands on them, which is handled
by :py:mod:`.module_contexts`)
"""

from enum import Enum
import functools
import json
import logging
import re
from typing import Any, Dict, Mapping, Optional, Type, TypeVar, Union

import numpy as np  # type: ignore
import jsonschema  # type: ignore

from opentrons.system.shared_data import load_shared_data
from opentrons.types import Location, Point, LocationLabware
from opentrons.protocols.types import APIVersion
from .definitions import MAX_SUPPORTED_VERSION, DeckItem, V2_MODULE_DEF_VERSION
from .labware import Labware


E = TypeVar('E', bound='_ProvideLookup')


class _ProvideLookup(Enum):
    @classmethod
    def from_str(cls: Type[E], typename: str) -> 'E':
        for m in cls.__members__.values():
            if m.value == typename:
                return m
        raise AttributeError(f'No such module type {typename}')


class ModuleType(_ProvideLookup):
    THERMOCYCLER: str = 'thermocyclerModuleType'
    TEMPERATURE: str = 'temperatureModuleType'
    MAGNETIC: str = 'magneticModuleType'


class MagneticModuleModel(_ProvideLookup):
    MAGNETIC_V1: str = 'magneticModuleV1'
    MAGNETIC_V2: str = 'magneticModuleV2'


class TemperatureModuleModel(_ProvideLookup):
    TEMPERATURE_V1: str = 'temperatureModuleV1'
    TEMPERATURE_V2: str = 'temperatureModuleV2'


class ThermocyclerModuleModel(_ProvideLookup):

    @classmethod
    def from_str(cls: Type['ThermocyclerModuleModel'],
                 typename: str) -> 'ThermocyclerModuleModel':
        return super().from_str(typename)

    THERMOCYCLER_V1: str = 'thermocyclerModuleV1'


ModuleModel = Union[
    MagneticModuleModel, TemperatureModuleModel, ThermocyclerModuleModel]


def module_model_from_string(model_string: str) -> ModuleModel:
    for model_enum in {
            MagneticModuleModel,
            TemperatureModuleModel,
            ThermocyclerModuleModel}:
        try:
            return model_enum.from_str(model_string)  # type: ignore
        except AttributeError:
            pass
    raise AttributeError(f"No such module model {model_string}")


log = logging.getLogger(__name__)


class NoSuchModuleError(Exception):
    def __init__(self, message: str, requested_module: ModuleModel) -> None:
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

    @property
    def separate_calibration(self) -> bool:
        # If a module is the parent of a labware it affects calibration
        return True

    def __init__(self,
                 display_name: str,
                 model: ModuleModel,
                 module_type: ModuleType,
                 offset: Point,
                 overall_height: float,
                 height_over_labware: float,
                 parent: Location,
                 api_level: APIVersion) -> None:
        """
        Create a Module for tracking the position of a module.

        Note that modules do not currently have a concept of calibration apart
        from calibration of labware on top of the module. The practical result
        of this is that if the module parent :py:class:`.Location` is
        incorrect, then acorrect calibration of one labware on the deck would
        be incorrect on the module, and vice-versa. Currently, the way around
        this would be to correct the :py:class:`.Location` so that the
        calibrated labware is targeted accurately in both positions.

        :param display_name: A human-readable display name of only the module
                             (for instance, "Thermocycler Module" - not
                             including parents or location)
        :param model: The model of module this represents
        :param offset: The offset from the slot origin at which labware loaded
                       on this module should be placed
        :param overall_height: The height of the module without labware
        :param height_over_labware: The height of this module over the top of
                                    the labware
        :param parent: A location representing location of the front left of
                       the outside of the module (usually the front-left corner
                       of a slot on the deck).
        :type parent: :py:class:`.Location`
        :param APIVersion api_level: the API version to set for the loaded
                                     :py:class:`ModuleGeometry` instance. The
                                     :py:class:`ModuleGeometry` will
                                     conform to this level.
        """
        self._api_version = api_level
        self._parent = parent
        self._module_type = module_type
        self._display_name = "{} on {}".format(
            display_name, str(parent.labware))
        self._model = model
        self._offset = offset
        self._height = overall_height + self._parent.point.z
        self._over_labware = height_over_labware
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
    def model(self) -> ModuleModel:
        return self._model

    @property
    def load_name(self) -> str:
        return self.model.value

    @property
    def module_type(self) -> ModuleType:
        """ The Moduletype """
        return self._module_type

    @property
    def parent(self) -> LocationLabware:
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

    def __repr__(self) -> str:
        return self._display_name


class ThermocyclerGeometry(ModuleGeometry):
    def __init__(self,
                 display_name: str,
                 model: ModuleModel,
                 module_type: ModuleType,
                 offset: Point,
                 overall_height: float,
                 height_over_labware: float,
                 lid_height: float,
                 parent: Location,
                 api_level: APIVersion) -> None:
        """
        Create a Module for tracking the position of a module.

        Note that modules do not currently have a concept of calibration apart
        from calibration of labware on top of the module. The practical result
        of this is that if the module parent :py:class:`.Location` is
        incorrect, then acorrect calibration of one labware on the deck would
        be incorrect on the module, and vice-versa. Currently, the way around
        this would be to correct the :py:class:`.Location` so that the
        calibrated labware is targeted accurately in both positions.

        :param display_name: A human-readable display name of only the module
                             (for instance, "Thermocycler Module" - not
                             including parents or location)
        :param model: The model of module this represents
        :param offset: The offset from the slot origin at which labware loaded
                       on this module should be placed
        :param overall_height: The height of the module without labware
        :param height_over_labware: The height of this module over the top of
                                    the labware
        :param parent: A location representing location of the front left of
                       the outside of the module (usually the front-left corner
                       of a slot on the deck).
        :type parent: :py:class:`.Location`
        :param APIVersion api_level: the API version to set for the loaded
                                     :py:class:`ModuleGeometry` instance. The
                                     :py:class:`ModuleGeometry` will
                                     conform to this level.
        """
        super().__init__(
            display_name, model, module_type, offset, overall_height,
            height_over_labware, parent, api_level)
        self._lid_height = lid_height
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


def _load_from_v1(definition: Dict[str, Any],
                  parent: Location,
                  api_level: APIVersion) -> ModuleGeometry:
    """ Load a module geometry from a v1 definition.

    The definition should be schema checked before being passed to this
    function; all definitions passed here are assumed to be valid.
    """
    mod_name = definition['loadName']
    model_lookup: Mapping[str, ModuleModel] = {
        'thermocycler': ThermocyclerModuleModel.THERMOCYCLER_V1,
        'magdeck': MagneticModuleModel.MAGNETIC_V1,
        'tempdeck': TemperatureModuleModel.TEMPERATURE_V1}
    type_lookup = {
        'thermocycler': ModuleType.THERMOCYCLER,
        'tempdeck': ModuleType.TEMPERATURE,
        'magdeck': ModuleType.MAGNETIC
    }
    model = model_lookup[mod_name]
    offset = Point(definition["labwareOffset"]["x"],
                   definition["labwareOffset"]["y"],
                   definition["labwareOffset"]["z"])
    overall_height = definition["dimensions"]["bareOverallHeight"]\

    height_over_labware = definition["dimensions"]["overLabwareHeight"]

    if model in ThermocyclerModuleModel:
        lid_height = definition['dimensions']['lidHeight']
        mod: ModuleGeometry = \
            ThermocyclerGeometry(definition["displayName"],
                                 model,
                                 type_lookup[mod_name],
                                 offset,
                                 overall_height,
                                 height_over_labware,
                                 lid_height,
                                 parent,
                                 api_level)
    else:
        mod = ModuleGeometry(definition['displayName'],
                             model,
                             type_lookup[mod_name],
                             offset,
                             overall_height,
                             height_over_labware,
                             parent, api_level)
    return mod


def _load_from_v2(definition: Dict[str, Any],
                  parent: Location,
                  api_level: APIVersion) -> ModuleGeometry:
    """ Load a module geometry from a v2 definition.

    The definition should be schema checked before being passed to this
     function; all definitions passed here are assumed to be valid.
    """
    pre_transform = np.array((definition['labwareOffset']['x'],
                              definition['labwareOffset']['y'],
                              1))
    par = parent.labware

    # this needs to change to look up the current deck type if/when we add
    # that notion
    xforms_ser = definition['slotTransforms']\
        .get('ot2_standard', {})\
        .get(par, {'labwareOffset': [[1, 0, 0], [0, 1, 0], [0, 0, 1]]})
    xform_ser = xforms_ser['labwareOffset']

    # apply the slot transform if any
    xform = np.array(xform_ser)
    xformed = np.dot(xform, pre_transform)
    opts = {
        'parent': parent,
        'api_level': api_level,
        'offset': Point(xformed[0],
                        xformed[1],
                        definition['labwareOffset']['z']),
        'overall_height': definition['dimensions']['bareOverallHeight'],
        'height_over_labware': definition['dimensions']['overLabwareHeight'],
        'model': module_model_from_string(definition['model']),
        'module_type': ModuleType.from_str(definition['moduleType']),
        'display_name': definition['displayName']
    }
    if definition['moduleType'] in {
            ModuleType.MAGNETIC.value,
            ModuleType.TEMPERATURE.value}:
        return ModuleGeometry(**opts)
    elif definition['moduleType'] == ModuleType.THERMOCYCLER.value:
        return ThermocyclerGeometry(
            lid_height=definition['dimensions']['lidHeight'],
            **opts)
    else:
        raise RuntimeError(f'Unknown module type {definition["moduleType"]}')


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
    schema = definition.get("$otSharedSchema")
    if not schema:
        # v1 definitions don't have schema versions
        return _load_from_v1(definition, parent, api_level)
    if schema == 'module/schemas/2':
        schema_doc = json.loads(load_shared_data("module/schemas/2.json"))
        try:
            jsonschema.validate(definition, schema_doc)
        except jsonschema.ValidationError:
            log.exception("Failed to validate module def schema")
            raise RuntimeError('The specified module definition is not valid.')
        return _load_from_v2(definition, parent, api_level)
    elif isinstance(schema, str):
        maybe_schema = re.match('^module/schemas/([0-9]+)$', schema)
        if maybe_schema:
            raise RuntimeError(
                f"Module definitions of schema version {maybe_schema.group(1)}"
                " are not supported in this robot software release.")
    log.error(f"Bad module definition (schema specifier {schema})")
    raise RuntimeError(
        'The specified module definition is not valid.')


def _load_v1_module_def(module_model: ModuleModel) -> Dict[str, Any]:
    v1names = {MagneticModuleModel.MAGNETIC_V1: 'magdeck',
               TemperatureModuleModel.TEMPERATURE_V1: 'tempdeck',
               ThermocyclerModuleModel.THERMOCYCLER_V1: 'thermocycler'}
    try:
        name = v1names[module_model]
    except KeyError:
        raise NoSuchModuleError(
            f'Could not find module {module_model.value}',
            module_model)
    return json.loads(load_shared_data('module/definitions/1.json'))[name]


def _load_v2_module_def(module_model: ModuleModel) -> Dict[str, Any]:
    try:
        return json.loads(
            load_shared_data(
                f'module/definitions/2/{module_model.value}.json'))
    except OSError:
        raise NoSuchModuleError(
            f'Could not find the module {module_model.value}.',
            module_model)


@functools.lru_cache(maxsize=128)
def _load_module_definition(api_level: APIVersion,
                            module_model: ModuleModel) -> Dict[str, Any]:
    """
    Load the appropriate module definition for this api version
    """
    if api_level < V2_MODULE_DEF_VERSION:
        try:
            return _load_v1_module_def(module_model)
        except NoSuchModuleError:
            try:
                dname = _load_v2_module_def(module_model)['displayName']
            except NoSuchModuleError:
                dname = module_model.value
            raise NoSuchModuleError(
                f'API version {api_level} does not support the module '
                f'{dname}. Please use at least version '
                f'{V2_MODULE_DEF_VERSION} to use this module.', module_model)
    else:
        return _load_v2_module_def(module_model)


def load_module(
        model: ModuleModel,
        parent: Location,
        api_level: APIVersion = None) -> ModuleGeometry:
    """
    Return a :py:class:`ModuleGeometry` object from a definition looked up
    by name.

    :param model: The module model to use. This should be one of the strings
                  returned by :py:func:`ModuleGeometry.resolve_module_model`
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
    defn = _load_module_definition(api_level, model)
    return load_module_from_definition(defn, parent, api_level)


def resolve_module_model(module_name: str) -> ModuleModel:
    """ Turn any of the supported load names into module model names """

    model_map: Mapping[str, ModuleModel] = {
        'magneticModuleV1': MagneticModuleModel.MAGNETIC_V1,
        'magneticModuleV2': MagneticModuleModel.MAGNETIC_V2,
        'temperatureModuleV1': TemperatureModuleModel.TEMPERATURE_V1,
        'temperatureModuleV2': TemperatureModuleModel.TEMPERATURE_V2,
        'thermocyclerModuleV1': ThermocyclerModuleModel.THERMOCYCLER_V1,
    }

    alias_map: Mapping[str, ModuleModel] = {
        'magdeck': MagneticModuleModel.MAGNETIC_V1,
        'magnetic module': MagneticModuleModel.MAGNETIC_V1,
        'magnetic module gen2': MagneticModuleModel.MAGNETIC_V2,
        'tempdeck': TemperatureModuleModel.TEMPERATURE_V1,
        'temperature module': TemperatureModuleModel.TEMPERATURE_V1,
        'temperature module gen2': TemperatureModuleModel.TEMPERATURE_V2,
        'thermocycler': ThermocyclerModuleModel.THERMOCYCLER_V1,
        'thermocycler module': ThermocyclerModuleModel.THERMOCYCLER_V1,
    }

    lower_name = module_name.lower()
    resolved_name = model_map.get(module_name, None) \
        or alias_map.get(lower_name, None)
    if not resolved_name:
        raise ValueError(
            f'{module_name} is not a valid module load name.\n'
            'Valid names (ignoring case): ''"' + '", "'
            .join(alias_map.keys()) + '"\n' +
            'You can also refer to modules by their ' +
            'exact model: ''"' + '", "'
            .join(model_map.keys()) + '"'
            )
    return resolved_name


def resolve_module_type(module_model: ModuleModel) -> ModuleType:
    return ModuleType.from_str(_load_module_definition(
        V2_MODULE_DEF_VERSION, module_model)['moduleType'])


def models_compatible(model_a: ModuleModel, model_b: ModuleModel) -> bool:
    """ Check if two module models may be considered the same """
    if model_a == model_b:
        return True
    return model_b.value in _load_module_definition(
        V2_MODULE_DEF_VERSION, model_a)['compatibleWith']
