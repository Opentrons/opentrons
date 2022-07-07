""" opentrons.protocol_api.module_geometry: classes and functions for modules
as deck objects

This module provides things like :py:class:`ModuleGeometry` and
:py:func:`load_module` to create and manipulate module objects as geometric
objects on the deck (as opposed to calling commands on them, which is handled
by :py:mod:`.module_contexts`)
"""
import functools
import logging
import re
from typing import Mapping, Optional, Union, TYPE_CHECKING

import numpy as np
import jsonschema  # type: ignore[import]
from opentrons import types
from opentrons.protocols.context.protocol_api.labware import LabwareImplementation

from opentrons_shared_data import module
from opentrons_shared_data.labware.dev_types import LabwareUri

from opentrons.drivers.types import HeaterShakerLabwareLatchStatus

from opentrons.hardware_control.modules.types import (
    ModuleModel,
    ModuleType,
    MagneticModuleModel,
    TemperatureModuleModel,
    ThermocyclerModuleModel,
    HeaterShakerModuleModel,
)
from opentrons.types import Location, Point, LocationLabware
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.definitions import (
    MAX_SUPPORTED_VERSION,
    POST_V1_MODULE_DEF_VERSION,
)
from opentrons.protocols.geometry.deck_item import DeckItem
from opentrons.protocol_api.labware import Labware

from .types import GenericConfiguration, ThermocyclerConfiguration

if TYPE_CHECKING:
    from opentrons_shared_data.module.dev_types import (
        ModuleDefinitionV1,
        ModuleDefinitionV3,
    )


def module_model_from_string(model_string: str) -> ModuleModel:
    for model_enum in {
        MagneticModuleModel,
        TemperatureModuleModel,
        ThermocyclerModuleModel,
        HeaterShakerModuleModel,
    }:
        try:
            return model_enum(model_string)
        except ValueError:
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


# TODO (spp, 2022-05-09): add tests
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

    def __init__(
        self,
        display_name: str,
        model: ModuleModel,
        module_type: ModuleType,
        offset: Point,
        overall_height: float,
        height_over_labware: float,
        parent: Location,
        api_level: APIVersion,
    ) -> None:
        """
        Create a Module for tracking the position of a module.

        Note that modules do not currently have a concept of calibration apart
        from calibration of labware on top of the module. The practical result
        of this is that if the module parent :py:class:`.Location` is
        incorrect, then a correct calibration of one labware on the deck would
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

        # Note (spp, 2022-05-23): I think this should say '{display_name} on {slot}'
        self._display_name = "{} on {}".format(display_name, str(parent.labware))
        self._model = model
        self._offset = offset
        self._height = overall_height + self._parent.point.z
        self._over_labware = height_over_labware
        self._labware: Optional[Labware] = None
        self._location = Location(point=self._offset + self._parent.point, labware=self)

    @property
    def api_version(self) -> APIVersion:
        return self._api_version

    def add_labware(self, labware: Labware) -> Labware:
        assert not self._labware, "{} is already on this module".format(self._labware)
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
        """The Moduletype"""
        return self._module_type

    @property
    def parent(self) -> LocationLabware:
        return self._parent.labware.object

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
    def __init__(
        self,
        display_name: str,
        model: ModuleModel,
        module_type: ModuleType,
        offset: Point,
        overall_height: float,
        height_over_labware: float,
        lid_height: float,
        parent: Location,
        api_level: APIVersion,
        configuration: GenericConfiguration = ThermocyclerConfiguration.FULL,
    ) -> None:
        """
        Create a Module for tracking the position of a module.

        Note that modules do not currently have a concept of calibration apart
        from calibration of labware on top of the module. The practical result
        of this is that if the module parent :py:class:`.Location` is
        incorrect, then a correct calibration of one labware on the deck would
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
        :param configuration: Used to specify the slot configuration of
                              the Thermocycler. It should by of type
                              :py:class:`.ThermocyclerConfiguration` and can
                              either be FULL or SEMI.
        """
        super().__init__(
            display_name,
            model,
            module_type,
            offset,
            overall_height,
            height_over_labware,
            parent,
            api_level,
        )
        self._lid_height = lid_height
        self._lid_status = "open"  # Needs to reflect true status
        self._configuration = configuration
        if self.is_semi_configuration:
            self._offset = self._offset + Point(-23.28, 0, 0)

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

    @property
    def is_semi_configuration(self) -> bool:
        return bool(self._configuration == ThermocyclerConfiguration.SEMI)

    @property
    def covered_slots(self) -> set:
        if self.is_semi_configuration:
            return {7, 10}
        else:
            return {7, 8, 10, 11}

    # NOTE: this func is unused until "semi" configuration
    def labware_accessor(self, labware: Labware) -> Labware:
        # Block first three columns from being accessed
        definition = labware._implementation.get_definition()
        definition["ordering"] = definition["ordering"][2::]
        return Labware(
            implementation=LabwareImplementation(definition, super().location),
            api_level=self._api_version,
        )

    def add_labware(self, labware: Labware) -> Labware:
        assert not self._labware, "{} is already on this module".format(self._labware)
        assert self.lid_status != "closed", "Cannot place labware in closed module"
        if self.is_semi_configuration:
            self._labware = self.labware_accessor(labware)
        else:
            self._labware = labware
        return self._labware

    def flag_unsafe_move(
        self,
        to_loc: types.Location,
        from_loc: types.Location,
        lid_position: Optional[str],
    ):
        to_lw, to_well = to_loc.labware.get_parent_labware_and_well()
        from_lw, from_well = from_loc.labware.get_parent_labware_and_well()
        if (
            self.labware is not None
            and (self.labware == to_lw or self.labware == from_lw)
            and lid_position != "open"
        ):
            raise RuntimeError(
                "Cannot move to labware loaded in Thermocycler"
                " when lid is not fully open."
            )


class HeaterShakerGeometry(ModuleGeometry):
    """Class holding the state of a heater-shaker's physical geometry."""

    # TODO(mc, 2022-06-16): move these constants to the module definition
    MAX_X_ADJACENT_ITEM_HEIGHT = 53.0
    """Maximum height of an adjacent item in the x-direction.

    This value selected to avoid interference
    with the heater-shaker's labware latch.

    For background, see: https://github.com/Opentrons/opentrons/issues/10316
    """

    ALLOWED_ADJACENT_TALL_LABWARE = [
        LabwareUri("opentrons/opentrons_96_filtertiprack_10ul/1"),
        LabwareUri("opentrons/opentrons_96_filtertiprack_200ul/1"),
        LabwareUri("opentrons/opentrons_96_filtertiprack_20ul/1"),
        LabwareUri("opentrons/opentrons_96_tiprack_10ul/1"),
        LabwareUri("opentrons/opentrons_96_tiprack_20ul/1"),
        LabwareUri("opentrons/opentrons_96_tiprack_300ul/1"),
    ]
    """URI's of labware that are allowed to exceed the height limit above.

    These labware do not take up the full with of the slot
    in the area that would interfere with the labware latch.

    For background, see: https://github.com/Opentrons/opentrons/issues/10316
    """

    def __init__(
        self,
        display_name: str,
        model: ModuleModel,
        module_type: ModuleType,
        offset: Point,
        overall_height: float,
        height_over_labware: float,
        parent: Location,
        api_level: APIVersion,
    ) -> None:
        """Heater-Shaker geometry constructor. Inherits from ModuleGeometry."""
        super().__init__(
            display_name,
            model,
            module_type,
            offset,
            overall_height,
            height_over_labware,
            parent,
            api_level,
        )
        self._latch_status = HeaterShakerLabwareLatchStatus.IDLE_UNKNOWN

    @property
    def latch_status(self) -> HeaterShakerLabwareLatchStatus:
        return self._latch_status

    @latch_status.setter
    def latch_status(self, status: HeaterShakerLabwareLatchStatus) -> None:
        self._latch_status = status


def _load_from_v1(
    definition: "ModuleDefinitionV1", parent: Location, api_level: APIVersion
) -> ModuleGeometry:
    """Load a module geometry from a v1 definition.

    The definition should be schema checked before being passed to this
    function; all definitions passed here are assumed to be valid.
    """
    mod_name = definition["loadName"]
    model_lookup: Mapping[str, ModuleModel] = {
        "thermocycler": ThermocyclerModuleModel.THERMOCYCLER_V1,
        "magdeck": MagneticModuleModel.MAGNETIC_V1,
        "tempdeck": TemperatureModuleModel.TEMPERATURE_V1,
    }
    type_lookup = {
        "thermocycler": ModuleType.THERMOCYCLER,
        "tempdeck": ModuleType.TEMPERATURE,
        "magdeck": ModuleType.MAGNETIC,
    }
    model = model_lookup[mod_name]
    offset = Point(
        definition["labwareOffset"]["x"],
        definition["labwareOffset"]["y"],
        definition["labwareOffset"]["z"],
    )
    overall_height = definition["dimensions"]["bareOverallHeight"]
    height_over_labware = definition["dimensions"]["overLabwareHeight"]

    if model in ThermocyclerModuleModel:
        lid_height = definition["dimensions"]["lidHeight"]
        mod: ModuleGeometry = ThermocyclerGeometry(
            definition["displayName"],
            model,
            type_lookup[mod_name],
            offset,
            overall_height,
            height_over_labware,
            lid_height,
            parent,
            api_level,
        )
    else:
        mod = ModuleGeometry(
            definition["displayName"],
            model,
            type_lookup[mod_name],
            offset,
            overall_height,
            height_over_labware,
            parent,
            api_level,
        )
    return mod


def _load_from_v3(
    definition: "ModuleDefinitionV3",
    parent: Location,
    api_level: APIVersion,
    configuration: GenericConfiguration,
) -> ModuleGeometry:
    """Load a module geometry from a v3 definition.

    The definition should be schema checked before being passed to this
     function; all definitions passed here are assumed to be valid.
    """
    pre_transform = np.array(
        (definition["labwareOffset"]["x"], definition["labwareOffset"]["y"], 1)
    )
    if not parent.labware.is_slot:
        par = ""
        log.warning(
            f"module location parent labware was {parent.labware} which is"
            "not a slot name; slot transforms will not be loaded"
        )
    else:
        par = str(parent.labware.object)

    # this needs to change to look up the current deck type if/when we add
    # that notion
    xforms_ser = (
        definition["slotTransforms"]
        .get("ot2_standard", {})
        .get(par, {"labwareOffset": [[1, 0, 0], [0, 1, 0], [0, 0, 1]]})
    )
    xform_ser = xforms_ser["labwareOffset"]

    # apply the slot transform if any
    xform = np.array(xform_ser)
    xformed = np.dot(xform, pre_transform)
    if definition["moduleType"] in {
        ModuleType.MAGNETIC.value,
        ModuleType.TEMPERATURE.value,
    }:
        return ModuleGeometry(
            parent=parent,
            api_level=api_level,
            offset=Point(xformed[0], xformed[1], definition["labwareOffset"]["z"]),
            overall_height=definition["dimensions"]["bareOverallHeight"],
            height_over_labware=definition["dimensions"]["overLabwareHeight"],
            model=module_model_from_string(definition["model"]),
            module_type=ModuleType(definition["moduleType"]),
            display_name=definition["displayName"],
        )
    elif definition["moduleType"] == ModuleType.THERMOCYCLER.value:
        return ThermocyclerGeometry(
            parent=parent,
            api_level=api_level,
            offset=Point(xformed[0], xformed[1], definition["labwareOffset"]["z"]),
            overall_height=definition["dimensions"]["bareOverallHeight"],
            height_over_labware=definition["dimensions"]["overLabwareHeight"],
            model=module_model_from_string(definition["model"]),
            module_type=ModuleType(definition["moduleType"]),
            display_name=definition["displayName"],
            lid_height=definition["dimensions"]["lidHeight"],
            configuration=configuration,
        )
    elif definition["moduleType"] == ModuleType.HEATER_SHAKER.value:
        return HeaterShakerGeometry(
            parent=parent,
            api_level=api_level,
            offset=Point(xformed[0], xformed[1], definition["labwareOffset"]["z"]),
            overall_height=definition["dimensions"]["bareOverallHeight"],
            height_over_labware=definition["dimensions"]["overLabwareHeight"],
            model=module_model_from_string(definition["model"]),
            module_type=ModuleType(definition["moduleType"]),
            display_name=definition["displayName"],
        )
    else:
        raise RuntimeError(f'Unknown module type {definition["moduleType"]}')


def load_module_from_definition(
    definition: Union["ModuleDefinitionV1", "ModuleDefinitionV3"],
    parent: Location,
    api_level: APIVersion = None,
    configuration: GenericConfiguration = ThermocyclerConfiguration.FULL,
) -> ModuleGeometry:
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
    # def not yet discriminated, mypy returns `object` type
    schema = definition.get("$otSharedSchema")
    if not schema:
        # v1 definitions don't have schema versions
        # but unfortunately we can't tell mypy that because it can only
        # discriminate unions based on literal tags or similar, not the
        # presence or absence of keys
        v1def: "ModuleDefinitionV1" = definition  # type: ignore
        return _load_from_v1(v1def, parent, api_level)

    if schema == "module/schemas/3":
        schema_doc = module.load_schema("3")
        try:
            jsonschema.validate(definition, schema_doc)
        except jsonschema.ValidationError:
            log.exception("Failed to validate module def schema")
            raise RuntimeError("The specified module definition is not valid.")
        # mypy can't tell these apart, but we've schema validated it - this is
        # the right type
        v3def: "ModuleDefinitionV3" = definition  # type: ignore[assignment]
        return _load_from_v3(v3def, parent, api_level, configuration)

    elif isinstance(schema, str):
        maybe_schema = re.match("^module/schemas/([0-9]+)$", schema)
        if maybe_schema:
            raise RuntimeError(
                f"Module definitions of schema version {maybe_schema.group(1)}"
                " are not supported in this robot software release."
            )
    log.error(f"Bad module definition (schema specifier {schema})")
    raise RuntimeError("The specified module definition is not valid.")


def _load_v1_module_def(module_model: ModuleModel) -> "ModuleDefinitionV1":
    v1names = {
        MagneticModuleModel.MAGNETIC_V1: "magdeck",
        TemperatureModuleModel.TEMPERATURE_V1: "tempdeck",
        ThermocyclerModuleModel.THERMOCYCLER_V1: "thermocycler",
    }
    try:
        name = v1names[module_model]
    except KeyError:
        raise NoSuchModuleError(
            f"Could not find module {module_model.value}", module_model
        )
    return module.load_definition("1", name)


def _load_v3_module_def(module_model: ModuleModel) -> "ModuleDefinitionV3":
    try:
        return module.load_definition("3", module_model.value)
    except module.ModuleNotFoundError:
        raise NoSuchModuleError(
            f"Could not find the module {module_model.value} in the "
            f"specified API version.",
            module_model,
        )


@functools.lru_cache(maxsize=128)
def _load_module_definition(
    api_level: APIVersion, module_model: ModuleModel
) -> Union["ModuleDefinitionV3", "ModuleDefinitionV1"]:
    """
    Load the appropriate module definition for this api version
    """

    if api_level < POST_V1_MODULE_DEF_VERSION:
        try:
            return _load_v1_module_def(module_model)
        except NoSuchModuleError:
            try:
                dname = _load_v3_module_def(module_model)["displayName"]
            except NoSuchModuleError:
                dname = module_model.value
            raise NoSuchModuleError(
                f"API version {api_level} does not support the module "
                f"{dname}. Please use at least version "
                f"{POST_V1_MODULE_DEF_VERSION} to use this module.",
                module_model,
            )
    else:
        return _load_v3_module_def(module_model)


def load_module(
    model: ModuleModel,
    parent: Location,
    api_level: APIVersion = None,
    configuration: str = None,
) -> ModuleGeometry:
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
    :param configuration: Used to specify the slot configuration of
                        the Thermocycler. Only Valid in Python API
                        Version 2.4 and later. If you wish to use
                        the non-full plate configuration, you must
                        pass in the key word value `semi`
    """
    api_level = api_level or MAX_SUPPORTED_VERSION
    defn = _load_module_definition(api_level, model)
    if configuration:
        # Here we are converting the string passed in to a
        # configuration type. For now we only have
        # Thermocycler configurations, but there could be others
        # in the future
        return load_module_from_definition(
            defn,
            parent,
            api_level,
            ThermocyclerConfiguration.configuration_type(configuration),
        )
    else:
        return load_module_from_definition(defn, parent, api_level)


def resolve_module_model(module_model_or_load_name: str) -> ModuleModel:
    """Turn any of the supported APIv2 load names into module model names."""

    model_map: Mapping[str, ModuleModel] = {
        "magneticModuleV1": MagneticModuleModel.MAGNETIC_V1,
        "magneticModuleV2": MagneticModuleModel.MAGNETIC_V2,
        "temperatureModuleV1": TemperatureModuleModel.TEMPERATURE_V1,
        "temperatureModuleV2": TemperatureModuleModel.TEMPERATURE_V2,
        "thermocyclerModuleV1": ThermocyclerModuleModel.THERMOCYCLER_V1,
        "thermocyclerModuleV2": ThermocyclerModuleModel.THERMOCYCLER_V2,
        "heaterShakerModuleV1": HeaterShakerModuleModel.HEATER_SHAKER_V1,
    }

    alias_map: Mapping[str, ModuleModel] = {
        "magdeck": MagneticModuleModel.MAGNETIC_V1,
        "magnetic module": MagneticModuleModel.MAGNETIC_V1,
        "magnetic module gen2": MagneticModuleModel.MAGNETIC_V2,
        "tempdeck": TemperatureModuleModel.TEMPERATURE_V1,
        "temperature module": TemperatureModuleModel.TEMPERATURE_V1,
        "temperature module gen2": TemperatureModuleModel.TEMPERATURE_V2,
        "thermocycler": ThermocyclerModuleModel.THERMOCYCLER_V1,
        "thermocycler module": ThermocyclerModuleModel.THERMOCYCLER_V1,
        "thermocycler module gen2": ThermocyclerModuleModel.THERMOCYCLER_V2,
        # No alias for heater-shaker. Use heater-shaker model name for loading.
    }

    lower_name = module_model_or_load_name.lower()
    resolved_name = model_map.get(module_model_or_load_name, None) or alias_map.get(
        lower_name, None
    )
    if not resolved_name:
        raise ValueError(
            f"{module_model_or_load_name} is not a valid module load name.\n"
            "Valid names (ignoring case): "
            '"'
            + '", "'.join(alias_map.keys())
            + '"\n'
            + "You can also refer to modules by their "
            + "exact model: "
            '"' + '", "'.join(model_map.keys()) + '"'
        )
    return resolved_name


def resolve_module_type(module_model: ModuleModel) -> ModuleType:
    return ModuleType(_load_v3_module_def(module_model)["moduleType"])


def models_compatible(model_a: ModuleModel, model_b: ModuleModel) -> bool:
    """Check if two module models may be considered the same"""
    if model_a == model_b:
        return True
    return model_b.value in _load_v3_module_def(model_a)["compatibleWith"]
