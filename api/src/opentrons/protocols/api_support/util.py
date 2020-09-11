""" Utility functions and classes for the protocol api """
from collections import UserDict
import functools
import logging
import math
from dataclasses import dataclass, field, astuple
from typing import (Any, Callable, Dict, Optional,
                    TYPE_CHECKING, Union, List, Set)

from opentrons import types as top_types
from opentrons.protocols.types import APIVersion
from opentrons.hardware_control import (types, SynchronousAdapter, API,
                                        HardwareAPILike, ThreadManager)
if TYPE_CHECKING:
    from opentrons.protocol_api.contexts import InstrumentContext
    from opentrons.protocol_api.labware import Well, Labware
    from opentrons.protocols.geometry.deck import Deck
    from opentrons.hardware_control.dev_types import HasLoop # noqa (F501)


MODULE_LOG = logging.getLogger(__name__)


class APIVersionError(Exception):
    """
    Error raised when a protocol attempts to access behavior not implemented
    """
    pass


def _assert_gzero(val: Any, message: str) -> float:
    try:
        new_val = float(val)
        assert new_val > 0.0
        return new_val
    except (TypeError, ValueError, AssertionError):
        raise AssertionError(message)


@dataclass
class EdgeList:
    right: Optional[top_types.Point] = field(default_factory=top_types.Point)
    left: Optional[top_types.Point] = field(default_factory=top_types.Point)
    center: Optional[top_types.Point] = field(default_factory=top_types.Point)
    up: top_types.Point = field(default_factory=top_types.Point)
    down: top_types.Point = field(default_factory=top_types.Point)


def determine_edge_path(
        where: 'Well', mount: top_types.Mount,
        default_edges: EdgeList, deck: 'Deck') -> EdgeList:
    left_path = EdgeList(
        left=default_edges.left,
        right=None,
        center=default_edges.center,
        up=default_edges.up,
        down=default_edges.down)
    right_path = EdgeList(
        left=None,
        right=default_edges.right,
        center=default_edges.center,
        up=default_edges.up,
        down=default_edges.down
    )
    labware = where.parent

    r_mount = top_types.Mount.RIGHT
    l_mount = top_types.Mount.LEFT
    l_col = labware.columns()[0]
    r_col = labware.columns()[-1]
    right_pip_criteria = mount is r_mount and where in l_col
    left_pip_criteria = mount is l_mount and where in r_col

    next_to_mod = deck.is_edge_move_unsafe(mount, labware)
    if labware.parent in ['3', '6', '9'] and left_pip_criteria:
        return left_path
    elif left_pip_criteria and next_to_mod:
        return left_path
    elif right_pip_criteria and next_to_mod:
        return right_path
    return default_edges


def build_edges(
        where: 'Well', offset: float,
        version: APIVersion, mount: top_types.Mount, deck: 'Deck',
        radius: float = 1.0) -> List[top_types.Point]:
    # Determine the touch_tip edges/points
    offset_pt = top_types.Point(0, 0, offset)
    edge_list = EdgeList(
        right=where._from_center_cartesian(x=radius, y=0, z=1) + offset_pt,
        left=where._from_center_cartesian(x=-radius, y=0, z=1) + offset_pt,
        center=where._from_center_cartesian(x=0, y=0, z=1) + offset_pt,
        up=where._from_center_cartesian(x=0, y=radius, z=1) + offset_pt,
        down=where._from_center_cartesian(x=0, y=-radius, z=1) + offset_pt
    )

    if version < APIVersion(2, 4):
        edge_list.center = None
        # Add the center value before switching axes
        return [edge for edge in astuple(edge_list) if edge]
    new_edges = determine_edge_path(where, mount, edge_list, deck)
    return [edge for edge in astuple(new_edges) if edge]


<<<<<<< HEAD
def labware_column_shift(
        initial_well: 'Well', tiprack: 'Labware',
        well_spacing: int = 4) -> 'Well':
    unshifted_index = tiprack.wells().index(initial_well)
    unshifted_column = math.floor(unshifted_index/8)
    shifted_column = unshifted_column + well_spacing
    shifted_well = unshifted_index % 8
    return tiprack.columns()[shifted_column][shifted_well]
=======
def labware_column_shift(initial_well: 'Well', well_spacing: int = 4) -> str:
    unshifted_well = initial_well.well_name
    shifted_column = str(int(unshifted_well[1::]) + well_spacing)
    shifted_well_name = unshifted_well[0] + shifted_column
    return shifted_well_name
>>>>>>> Fixup: slightly modify tip tracking


def first_parent(loc: top_types.LocationLabware) -> Optional[str]:
    """ Return the topmost parent of this location. It should be
    either a string naming a slot or a None if the location isn't
    associated with a slot """

    # cycle-detecting recursive climbing
    seen: Set[top_types.LocationLabware] = set()

    # internal function to have the cycle detector different per call
    def _fp_recurse(location: top_types.LocationLabware):
        if location in seen:
            raise RuntimeError('Cycle in labware parent')
        seen.add(location)
        if location is None or isinstance(location, str):
            return location
        else:
            return first_parent(location.parent)

    return _fp_recurse(loc)


class FlowRates:
    """ Utility class for rich setters/getters for flow rates """
    def __init__(self,
                 instr: 'InstrumentContext') -> None:
        self._instr = instr

    def set_defaults(self, api_level: APIVersion):
        self.aspirate = _find_value_for_api_version(
            api_level, self._instr.hw_pipette['default_aspirate_flow_rates'])
        self.dispense = _find_value_for_api_version(
            api_level, self._instr.hw_pipette['default_dispense_flow_rates'])
        self.blow_out = _find_value_for_api_version(
            api_level, self._instr.hw_pipette['default_blow_out_flow_rates'])

    @property
    def aspirate(self) -> float:
        return self._instr.hw_pipette['aspirate_flow_rate']

    @aspirate.setter
    def aspirate(self, new_val: float):
        self._instr._hw_manager.hardware.set_flow_rate(
            mount=self._instr._mount,
            aspirate=_assert_gzero(
                new_val, 'flow rate should be a numerical value in ul/s'))

    @property
    def dispense(self) -> float:
        return self._instr.hw_pipette['dispense_flow_rate']

    @dispense.setter
    def dispense(self, new_val: float):
        self._instr._hw_manager.hardware.set_flow_rate(
            mount=self._instr._mount,
            dispense=_assert_gzero(
                new_val, 'flow rate should be a numerical value in ul/s'))

    @property
    def blow_out(self) -> float:
        return self._instr.hw_pipette['blow_out_flow_rate']

    @blow_out.setter
    def blow_out(self, new_val: float):
        self._instr._hw_manager.hardware.set_flow_rate(
            mount=self._instr._mount,
            blow_out=_assert_gzero(
                new_val, 'flow rate should be a numerical value in ul/s'))


def _find_value_for_api_version(for_version: APIVersion,
                                values: Dict[str, float]) -> float:
    """
    Parse a dict that looks like
    {"2.0": 5,
    "2.5": 4}
    (aka the flow rate values from pipette config) and return the value for
    the highest api level that is at or underneath ``for_version``
    """
    sorted_versions = sorted({APIVersion.from_string(k): v
                              for k, v in values.items()})
    last = values[str(sorted_versions[0])]
    for version in sorted_versions:
        if version > for_version:
            break
        last = values[str(version)]
    return last


class PlungerSpeeds:
    """ Utility class for rich setters/getters for speeds """
    def __init__(self,
                 instr: 'InstrumentContext') -> None:
        self._instr = instr

    @property
    def aspirate(self) -> float:
        return self._instr.hw_pipette['aspirate_speed']

    @aspirate.setter
    def aspirate(self, new_val: float):
        self._instr._hw_manager.hardware.set_pipette_speed(
            mount=self._instr._mount,
            aspirate=_assert_gzero(
                new_val, 'speed should be a numerical value in mm/s'))

    @property
    def dispense(self) -> float:
        return self._instr.hw_pipette['dispense_speed']

    @dispense.setter
    def dispense(self, new_val: float):
        self._instr._hw_manager.hardware.set_pipette_speed(
            mount=self._instr._mount,
            dispense=_assert_gzero(
                new_val, 'speed should be a numerical value in mm/s'))

    @property
    def blow_out(self) -> float:
        return self._instr.hw_pipette['blow_out_speed']

    @blow_out.setter
    def blow_out(self, new_val: float):
        self._instr._hw_manager.hardware.set_pipette_speed(
            mount=self._instr._mount,
            blow_out=_assert_gzero(
                new_val, 'speed should be a numerical value in mm/s'))


class Clearances:
    def __init__(self,
                 default_aspirate: float,
                 default_dispense: float) -> None:
        self._aspirate = default_aspirate
        self._dispense = default_dispense

    @property
    def aspirate(self) -> float:
        return self._aspirate

    @aspirate.setter
    def aspirate(self, new_val: float):
        self._aspirate = float(new_val)

    @property
    def dispense(self) -> float:
        return self._dispense

    @dispense.setter
    def dispense(self, new_val: float):
        self._dispense = float(new_val)


class AxisMaxSpeeds(UserDict):
    """ Special mapping allowing internal storage by Mount enums and
    user access by string
    """

    def __getitem__(self, key: Union[str, types.Axis]):
        checked_key = AxisMaxSpeeds._verify_key(key)
        return self.data[checked_key]

    @staticmethod
    def _verify_key(key: Any) -> types.Axis:
        if isinstance(key, types.Axis):
            checked_key: Optional[types.Axis] = key
        elif isinstance(key, str):
            checked_key = types.Axis[key.upper()]
        else:
            checked_key = None
        if checked_key not in types.Axis.gantry_axes():
            raise KeyError(key)
        return checked_key

    def __setitem__(self, key: Any, value: Any):
        if value is None:
            del self[key]
            return

        checked_key = AxisMaxSpeeds._verify_key(key)
        checked_val = _assert_gzero(
            value, 'max speeds should be numerical values in mm/s')

        self.data[checked_key] = checked_val

    def __delitem__(self, key: Union[str, types.Axis]):
        checked_key = AxisMaxSpeeds._verify_key(key)
        del self.data[checked_key]

    def __iter__(self):
        """ keys() and dict iteration return string keys """
        return (k.name for k in self.data.keys())

    def keys(self):
        return (k.name for k in self.data.keys())

    def items(self):
        return ((k.name, v) for k, v in self.data.items())


HardwareToManage = Union[ThreadManager,
                         SynchronousAdapter,
                         'HasLoop']


# TODO: BC 2020-03-02 This class's utility as a utility class is drying up.
# It's only job is to ensure that the hardware a given
# ProtocolContext references, is synchronously callable.
# All internal calls to ProtocolContext __init__
# or build_using, either pass a ThreadManaged API instance
# or pass None and expect HardwareManager to create one
# for them. It seems as though we could replace this
# with a single if else that covers just those two cases.
# If that were the case, perhaps it would be clearer to move
# this logic back into the ProtocolContext definition
# and hold onto a sync hardware api directly instead of
# through the ._hw_manager.hardware indirection.
class HardwareManager:
    def __init__(self, hardware: Optional[HardwareToManage]):
        if hardware is None:
            self._current = ThreadManager(API.build_hardware_simulator).sync
        elif isinstance(hardware, SynchronousAdapter):
            self._current = hardware
        elif isinstance(hardware, ThreadManager):
            self._current = hardware.sync
        else:
            self._current = SynchronousAdapter(hardware)

    @property
    def hardware(self):
        return self._current

    def set_hw(self, hardware):
        if isinstance(hardware, SynchronousAdapter):
            self._current = hardware
        elif isinstance(hardware, ThreadManager):
            self._current = hardware.sync
        elif isinstance(hardware, HardwareAPILike):
            self._current = SynchronousAdapter(hardware)
        else:
            raise TypeError(
                "hardware should be API or synch adapter but is {}"
                .format(hardware))
        return self._current

    def reset_hw(self):
        self._current = ThreadManager(API.build_hardware_simulator).sync
        return self._current


def clamp_value(
        input_value: float, max_value: float, min_value: float,
        log_tag: str = '') -> float:
    if input_value > max_value:
        MODULE_LOG.info(
            f'{log_tag} clamped input {input_value} to {max_value}')
        return max_value
    if input_value < min_value:
        MODULE_LOG.info(
            f'{log_tag} clamped input {input_value} to {min_value}')
        return min_value
    return input_value


def requires_version(
        major: int, minor: int) -> Callable[[Callable], Callable]:
    """ Decorator. Apply to Protocol API methods or attributes to indicate
    the first version in which the method or attribute was present.
    """
    def _set_version(decorated_obj: Callable) -> Callable:
        added_version = APIVersion(major, minor)
        setattr(decorated_obj, '__opentrons_version_added',
                added_version)
        if hasattr(decorated_obj, '__doc__'):
            # Add the versionadded stanza to everything decorated if we can
            docstr = decorated_obj.__doc__ or ''
            # this newline and initial space has to be there for sphinx to
            # parse this correctly and not add it into for instance a
            # previous code-block
            docstr += f'\n\n        .. versionadded:: {added_version}\n\n'
            decorated_obj.__doc__ = docstr

        @functools.wraps(decorated_obj)
        def _check_version_wrapper(*args, **kwargs):
            slf = args[0]
            added_in = decorated_obj.__opentrons_version_added  # type: ignore
            current_version = slf._api_version
            if current_version >= APIVersion(2, 0)\
               and current_version < added_in:
                raise APIVersionError(
                    f'{decorated_obj} was added in {added_in}, but your '
                    f'protocol requested version {current_version}. You '
                    f'must increase your API version to {added_in} to '
                    'use this functionality.')
            return decorated_obj(*args, **kwargs)

        return _check_version_wrapper

    return _set_version


class ModifiedList(list):
    def __contains__(self, item):
        for name in self:
            if name == item.replace("-", "_").lower():
                return True
        return False


def convert_door_state_to_bool(door_state: types.DoorState):
    return True if door_state == types.DoorState.CLOSED else False
