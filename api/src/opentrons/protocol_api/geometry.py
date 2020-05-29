from collections import UserDict
import functools
import logging
import json
from dataclasses import dataclass
from typing import Any, List, Optional, Tuple, Dict

from opentrons import types
from opentrons.hardware_control.types import CriticalPoint
from opentrons.hardware_control.util import plan_arc
from opentrons_shared_data import load_shared_data
from .labware import (Labware, Well,
                      quirks_from_any_parent)
from .definitions import DeckItem
from .module_geometry import ThermocyclerGeometry, ModuleGeometry, ModuleType
from .util import first_parent


MODULE_LOG = logging.getLogger(__name__)

# Amount of slots in a single deck row
ROW_LENGTH = 3


@dataclass
class CalibrationPosition:
    """
    A point on the deck of a robot that is used to calibrate
    aspects of the robot's movement system as defined by
    opentrons/shared-data/deck/schemas/2.json
    """
    id: str
    position: List[float]
    displayName: str


class LabwareHeightError(Exception):
    pass


def max_many(*args):
    return functools.reduce(max, args[1:], args[0])


def split_loc_labware(
        loc: types.Location) -> Tuple[Optional[Labware], Optional[Well]]:
    if isinstance(loc.labware, Labware):
        return loc.labware, None
    elif isinstance(loc.labware, Well):
        return loc.labware.parent, loc.labware
    else:
        return None, None


BAD_PAIRS = [('1', '12'),
             ('12', '1'),
             ('4', '12'),
             ('12', '4'),
             ('4', '9'),
             ('9, 4'),
             ('4', '8'),
             ('8', '4'),
             ('1', '8'),
             ('8', '1'),
             ('4', '11'),
             ('11', '4'),
             ('1', '11'),
             ('11', '1')]


def should_dodge_thermocycler(
        deck: 'Deck',
        from_loc: types.Location,
        to_loc: types.Location) -> bool:
    """
    Decide if the requested path would cross the thermocycler, if
    installed.

    Returns True if we need to dodge, False otherwise
    """
    if any([isinstance(item, ThermocyclerGeometry) for item in deck.values()]):
        transit = (first_parent(from_loc.labware),
                   first_parent(to_loc.labware))
        # mypy doesn't like this because transit could be none, but it's
        # checked by value in BAD_PAIRS which has only strings
        return transit in BAD_PAIRS

    return False


@dataclass
class MoveConstraints:
    instr_max_height: float
    well_z_margin: float = 5.0
    lw_z_margin: float = 10.0
    minimum_lw_z_margin: float = 1.0
    minimum_z_height: float = 0.0

    @classmethod
    def build(cls, **kwargs):
        return cls(**{k: v for k, v in kwargs.items() if v is not None})


def safe_height(
        from_loc: types.Location,
        to_loc: types.Location,
        deck: 'Deck',
        instr_max_height: float,
        well_z_margin: float = None,
        lw_z_margin: float = None,
        minimum_lw_z_margin: float = None,
        minimum_z_height: float = None,) -> float:
    """
    Derive the height required to clear the current deck setup along
    with other constraints
    :param from_loc: The last location.
    :param to_loc: The location to move to.
    :param deck: The :py:class:`Deck` instance describing the robot.
    :param float instr_max_height: The highest z location this pipette can
                                   achieve
    :param float well_z_margin: How much extra Z margin to raise the cp by over
                                the bare minimum to clear wells within the same
                                labware. Default: 5mm
    :param float lw_z_margin: How much extra Z margin to raise the cp by over
                              the bare minimum to clear different pieces of
                              labware.
    :param minimum_z_height: When specified, this Z margin is able to raise
                             (but never lower) the mid-arc height.
    """
    constraints = MoveConstraints.build(
        instr_max_height=instr_max_height,
        well_z_margin=well_z_margin,
        lw_z_margin=lw_z_margin,
        minimum_lw_z_margin=minimum_lw_z_margin,
        minimum_z_height=minimum_z_height)
    assert constraints.minimum_z_height >= 0.0
    return _build_safe_height(from_loc, to_loc, deck, constraints)


def _build_safe_height(from_loc: types.Location,
                       to_loc: types.Location,
                       deck: 'Deck',
                       constraints: MoveConstraints) -> float:
    to_point = to_loc.point
    to_lw, to_well = split_loc_labware(to_loc)
    from_point = from_loc.point
    from_lw, from_well = split_loc_labware(from_loc)

    if to_lw and to_lw == from_lw:
        # If we know the labwares we’re moving from and to, we can calculate
        # a safe z based on their heights
        if to_well:
            to_safety = to_well.top().point.z + constraints.well_z_margin
        else:
            to_safety = to_lw.highest_z + constraints.well_z_margin
        if from_well:
            from_safety = from_well.top().point.z + constraints.well_z_margin
        else:
            from_safety = from_lw.highest_z + constraints.well_z_margin
        # if we are already at the labware, we know the instr max height would
        # be tall enough
        if max(from_safety, to_safety) > constraints.instr_max_height:
            to_safety = constraints.instr_max_height
            from_safety = 0.0  # (ignore since it's in a max())
    else:
        # One of our labwares is invalid so we have to just go above
        # deck.highest_z since we don’t know where we are
        to_safety = deck.highest_z + constraints.lw_z_margin

        if to_safety > constraints.instr_max_height:
            if constraints.instr_max_height\
               >= (deck.highest_z + constraints.minimum_lw_z_margin):
                to_safety = constraints.instr_max_height
            else:
                tallest_lw = list(filter(
                    lambda lw: lw.highest_z == deck.highest_z,
                    [lw for lw in deck.data.values() if lw]))[0]
                if isinstance(tallest_lw, ModuleGeometry) and\
                        tallest_lw.labware:
                    tallest_lw = tallest_lw.labware
                raise LabwareHeightError(
                    f"The {tallest_lw} has a total height of {deck.highest_z}"
                    " mm, which is too tall for your current pipette "
                    "configurations. The longest pipette on your robot can "
                    f"only be raised to {constraints.instr_max_height} mm "
                    "above the deck. "
                    "This may be because the labware is incorrectly defined, "
                    "incorrectly calibrated, or physically too tall. Please "
                    "check your labware definitions and calibrations.")
        from_safety = 0.0  # (ignore since it’s in a max())

    return max_many(
        to_point.z,
        from_point.z,
        to_safety,
        from_safety,
        constraints.minimum_z_height)


def plan_moves(
        from_loc: types.Location,
        to_loc: types.Location,
        deck: 'Deck',
        instr_max_height: float,
        well_z_margin: float = None,
        lw_z_margin: float = None,
        force_direct: bool = False,
        minimum_lw_z_margin: float = None,
        minimum_z_height: float = None,)\
        -> List[Tuple[types.Point,
                      Optional[CriticalPoint]]]:
    """ Plan moves between one :py:class:`.Location` and another.

    Each :py:class:`.Location` instance might or might not have a specific
    kind of geometry attached. This function is intended to return series
    of moves that contain the minimum safe retractions to avoid (known)
    labware on the specified :py:class:`Deck`.
    :param from_loc: The last location.
    :param to_loc: The location to move to.
    :param deck: The :py:class:`Deck` instance describing the robot.
    :param force_direct: If True, ignore any Z margins force a direct move

    The other parameters are as :py:meth:`safe_height`.

    :returns: A list of tuples of :py:class:`.Point` and critical point
              overrides to move through.
    """
    constraints = MoveConstraints.build(
        instr_max_height=instr_max_height,
        well_z_margin=well_z_margin,
        lw_z_margin=lw_z_margin,
        minimum_lw_z_margin=minimum_lw_z_margin,
        minimum_z_height=minimum_z_height)
    assert constraints.minimum_z_height >= 0.0

    to_point = to_loc.point
    to_lw, to_well = split_loc_labware(to_loc)
    from_point = from_loc.point
    from_lw, from_well = split_loc_labware(from_loc)
    dest_quirks = quirks_from_any_parent(to_lw)
    from_quirks = quirks_from_any_parent(from_lw)
    from_center = 'centerMultichannelOnWells' in from_quirks
    to_center = 'centerMultichannelOnWells' in dest_quirks
    dest_cp_override = CriticalPoint.XY_CENTER if to_center else None
    origin_cp_override = CriticalPoint.XY_CENTER if from_center else None

    is_same_location = ((to_lw and to_lw == from_lw)
                        and (to_well and to_well == from_well))
    if (force_direct or (is_same_location and not
                         (minimum_z_height or 0) > 0)):
        # If we’re going direct, we can assume we’re already in the correct
        # cp so we can use the override without prep
        return [(to_point, dest_cp_override)]

    # Generate arc moves

    # Find the safe z heights based on the destination and origin labware/well
    safe = _build_safe_height(from_loc, to_loc, deck, constraints)
    must_dodge = should_dodge_thermocycler(deck, from_loc, to_loc)
    if must_dodge:
        sc = deck.get_slot_center('5')
        wp = [(sc.x, sc.y)]
    else:
        wp = []
    return plan_arc(from_point, to_point, safe,
                    origin_cp_override, dest_cp_override,
                    wp)


class Deck(UserDict):
    def __init__(self):
        super().__init__()
        row_offset = 90.5
        col_offset = 132.5
        for idx in range(1, 13):
            self.data[idx] = None
        self._positions = {idx + 1: types.Point((idx % 3) * col_offset,
                                                idx // 3 * row_offset,
                                                0)
                           for idx in range(12)}
        self._highest_z = 0.0
        # TODO: support deck loadName as a param
        def_path = 'deck/definitions/2/ot2_standard.json'
        self._definition = json.loads(load_shared_data(def_path))

    @staticmethod
    def _assure_int(key: object) -> int:
        if isinstance(key, str):
            return int(key)
        elif isinstance(key, int):
            return key
        else:
            raise TypeError(type(key))

    def _check_name(self, key: object) -> int:
        should_raise = False
        try:
            key_int = Deck._assure_int(key)
        except Exception:
            MODULE_LOG.exception("Bad slot name: {}".format(key))
            should_raise = True
        should_raise = should_raise or key_int not in self.data
        if should_raise:
            raise ValueError("Unknown slot: {}".format(key))
        else:
            return key_int

    def __getitem__(self, key: types.DeckLocation) -> DeckItem:
        return self.data[self._check_name(key)]

    def __delitem__(self, key: types.DeckLocation) -> None:
        checked_key = self._check_name(key)
        old = self.data[checked_key]
        self.data[checked_key] = None
        if old:
            self.recalculate_high_z()

    def __setitem__(self, key: types.DeckLocation, val: DeckItem) -> None:
        slot_key_int = self._check_name(key)
        item = self.data.get(slot_key_int)

        overlapping_items = self.get_collisions_for_item(slot_key_int, val)
        if item is not None:
            if slot_key_int == 12:
                if 'fixedTrash' in item.parameters.get('quirks', []):
                    pass
                else:
                    raise ValueError(f'Deck location {key} '
                                     'is for fixed trash only')
            else:
                raise ValueError(f'Deck location {key} already'
                                 f'  has an item: {self.data[slot_key_int]}')
        elif overlapping_items:
            flattened_overlappers = [repr(item) for sublist in
                                     overlapping_items.values()
                                     for item in sublist]
            raise ValueError(f'Could not load {val} as deck location {key} '
                             'is obscured by '
                             f'{", ".join(flattened_overlappers)}')
        self.data[slot_key_int] = val
        self._highest_z = max(val.highest_z, self._highest_z)

    def __contains__(self, key: object) -> bool:
        try:
            key_int = self._check_name(key)
        except ValueError:
            return False
        return key_int in self.data

    def is_edge_move_unsafe(
            self, mount: types.Mount, target: 'Labware') -> bool:
        """
        Check if slot next to target labware contains a module. Only relevant
        depending on the mount you are using and the column you are moving
        to inside of the labware.
        """
        slot = first_parent(target)
        if not slot:
            return False
        if mount is types.Mount.RIGHT:
            other_labware = self.left_of(slot)
        else:
            other_labware = self.right_of(slot)

        return isinstance(other_labware, ModuleGeometry)

    def right_of(self, slot: str) -> Optional[DeckItem]:
        if int(slot) % ROW_LENGTH == 0:
            # We know we're at the right-most edge
            # of the given row
            return None
        else:
            idx = int(slot) + 1
            return self[str(idx)]

    def left_of(self, slot: str) -> Optional[DeckItem]:
        if int(slot) - 1 % ROW_LENGTH == 0:
            # We know we're at the left-most edge
            # of the given row
            return None
        idx = int(slot) - 1
        if idx < 1:
            return None
        return self[str(idx)]

    def position_for(self, key: types.DeckLocation) -> types.Location:
        key_int = self._check_name(key)
        return types.Location(self._positions[key_int], str(key))

    def recalculate_high_z(self):
        self._highest_z = 0.0
        for item in [lw for lw in self.data.values() if lw]:
            self._highest_z = max(item.highest_z, self._highest_z)

    def get_slot_definition(self, slot_name) -> Dict[str, Any]:
        slots: List[Dict] = self._definition['locations']['orderedSlots']
        slot_def = next(
            (slot for slot in slots if slot['id'] == slot_name), None)
        if not slot_def:
            slot_ids = [slot['id'] for slot in slots]
            raise ValueError(f'slot {slot_name} could not be found,'
                             f'valid deck slots are: {slot_ids}')
        return slot_def

    def get_slot_center(self, slot_name) -> types.Point:
        defn = self.get_slot_definition(slot_name)
        return types.Point(
            defn['position'][0] + defn['boundingBox']['xDimension']/2,
            defn['position'][1] + defn['boundingBox']['yDimension']/2,
            defn['position'][2] + defn['boundingBox']['yDimension']/2)

    def resolve_module_location(
            self, module_type: ModuleType,
            location: Optional[types.DeckLocation]) -> types.DeckLocation:
        dn_from_type = {ModuleType.MAGNETIC: 'Magnetic Module',
                        ModuleType.THERMOCYCLER: 'Thermocycler',
                        ModuleType.TEMPERATURE: 'Temperature Module'}
        if isinstance(location, str) or isinstance(location, int):
            slot_def: Dict[str, Any] = self.get_slot_definition(
                str(location))
            compatible_modules: List[str] = slot_def['compatibleModuleTypes']
            if module_type.value in compatible_modules:
                return location
            else:
                raise AssertionError(
                    f'A {dn_from_type[module_type]} cannot be loaded'
                    f' into slot {location}')
        else:
            valid_slots = [
                slot['id'] for slot in self.slots
                if module_type.value in slot['compatibleModuleTypes']]
            if len(valid_slots) == 1:
                return valid_slots[0]
            elif not valid_slots:
                raise ValueError(
                    'A {dn_from_type[module_type]} cannot be used with this '
                    'deck')
            else:
                raise AssertionError(
                    f'{dn_from_type[module_type]}s do not have default'
                    ' location, you must specify a slot')

    @property
    def highest_z(self) -> float:
        """ Return the tallest known point on the deck. """
        return self._highest_z

    @property
    def slots(self) -> List[Dict]:
        """ Return the definition of the loaded robot deck. """
        return self._definition['locations']['orderedSlots']

    @property
    def calibration_positions(self) -> List[CalibrationPosition]:
        raw_positions = self._definition['locations']['calibrationPoints']
        return [CalibrationPosition(**pos) for pos in raw_positions]

    def get_calibration_position(self, id: str) -> CalibrationPosition:
        calibration_position = next(
            (pos for pos in self.calibration_positions if pos.id == id),
            None)
        if not calibration_position:
            pos_ids = [pos.id for pos in self.calibration_positions]
            raise ValueError(f'calibration position {id} '
                             'could not be found, '
                             f'valid calibration position ids are: {pos_ids}')
        return calibration_position

    def get_collisions_for_item(self,
                                slot_key: types.DeckLocation,
                                item: DeckItem) -> Dict[types.DeckLocation,
                                                        List[DeckItem]]:
        """ Return the loaded deck items that collide
            with the given item.
        """
        def get_item_covered_slot_keys(sk, i):
            if isinstance(i, ThermocyclerGeometry):
                return i.covered_slots
            elif i is not None:
                return set([sk])
            else:
                return set([])

        item_slot_keys = get_item_covered_slot_keys(slot_key, item)

        colliding_items: Dict[types.DeckLocation, List[DeckItem]] = {}
        for sk, i in self.data.items():
            covered_sks = get_item_covered_slot_keys(sk, i)
            if item_slot_keys.issubset(covered_sks):
                colliding_items.setdefault(sk, []).append(i)
        return colliding_items
