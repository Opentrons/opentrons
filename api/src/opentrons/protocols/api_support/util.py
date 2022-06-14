""" Utility functions and classes for the protocol api """
from __future__ import annotations

from collections import UserDict
import functools
import logging
from dataclasses import dataclass, field, astuple
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Dict,
    List,
    Optional,
    TypeVar,
    Union,
    cast,
)

from opentrons import types as top_types
from opentrons.protocols.api_support.types import APIVersion
from opentrons.hardware_control.types import Axis

if TYPE_CHECKING:
    from opentrons.protocols.context.instrument import AbstractInstrument
    from opentrons.protocol_api.labware import Well, Labware
    from opentrons.protocols.geometry.deck import Deck

MODULE_LOG = logging.getLogger(__name__)


class APIVersionError(Exception):
    """
    Error raised when a protocol attempts to access behavior not implemented
    """

    pass


class UnsupportedAPIError(Exception):
    """Error raised when a protocol attempts to use unsupported API."""


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
    where: "Well", mount: top_types.Mount, default_edges: EdgeList, deck: "Deck"
) -> EdgeList:
    left_path = EdgeList(
        left=default_edges.left,
        right=None,
        center=default_edges.center,
        up=default_edges.up,
        down=default_edges.down,
    )
    right_path = EdgeList(
        left=None,
        right=default_edges.right,
        center=default_edges.center,
        up=default_edges.up,
        down=default_edges.down,
    )
    labware = where.parent

    r_mount = top_types.Mount.RIGHT
    l_mount = top_types.Mount.LEFT
    l_col = labware.columns()[0]
    r_col = labware.columns()[-1]
    right_pip_criteria = mount is r_mount and where in l_col
    left_pip_criteria = mount is l_mount and where in r_col

    next_to_mod = deck.is_edge_move_unsafe(mount, labware)
    if labware.parent in ["3", "6", "9"] and left_pip_criteria:
        return left_path
    elif left_pip_criteria and next_to_mod:
        return left_path
    elif right_pip_criteria and next_to_mod:
        return right_path
    return default_edges


def build_edges(
    where: "Well",
    offset: float,
    mount: top_types.Mount,
    deck: "Deck",
    radius: float = 1.0,
    version: APIVersion = APIVersion(2, 7),
) -> List[top_types.Point]:
    # Determine the touch_tip edges/points
    offset_pt = top_types.Point(0, 0, offset)
    edge_list = EdgeList(
        right=where.from_center_cartesian(x=radius, y=0, z=1) + offset_pt,
        left=where.from_center_cartesian(x=-radius, y=0, z=1) + offset_pt,
        center=where.from_center_cartesian(x=0, y=0, z=1) + offset_pt,
        up=where.from_center_cartesian(x=0, y=radius, z=1) + offset_pt,
        down=where.from_center_cartesian(x=0, y=-radius, z=1) + offset_pt,
    )

    if version < APIVersion(2, 4):
        edge_list.center = None
        # Add the center value before switching axes
        return [edge for edge in astuple(edge_list) if edge]
    new_edges = determine_edge_path(where, mount, edge_list, deck)
    return [edge for edge in astuple(new_edges) if edge]


def labware_column_shift(
    initial_well: "Well",
    tiprack: "Labware",
    well_spacing: int = 4,
    modulo_value: int = 8,
) -> "Well":
    unshifted_index = tiprack.wells().index(initial_well)
    unshifted_column = unshifted_index // modulo_value
    shifted_column = unshifted_column + well_spacing
    shifted_well = unshifted_index % modulo_value
    return tiprack.columns()[shifted_column][shifted_well]


class FlowRates:
    """Utility class for rich setters/getters for flow rates"""

    def __init__(self, instr: AbstractInstrument) -> None:
        self._instr = instr

    def set_defaults(self, api_level: APIVersion):
        pipette = self._instr.get_pipette()
        self.aspirate = _find_value_for_api_version(
            api_level, pipette["default_aspirate_flow_rates"]
        )
        self.dispense = _find_value_for_api_version(
            api_level, pipette["default_dispense_flow_rates"]
        )
        self.blow_out = _find_value_for_api_version(
            api_level, pipette["default_blow_out_flow_rates"]
        )

    @property
    def aspirate(self) -> float:
        return self._instr.get_pipette()["aspirate_flow_rate"]

    @aspirate.setter
    def aspirate(self, new_val: float):
        self._instr.set_flow_rate(
            aspirate=_assert_gzero(
                new_val, "flow rate should be a numerical value in ul/s"
            )
        )

    @property
    def dispense(self) -> float:
        return self._instr.get_pipette()["dispense_flow_rate"]

    @dispense.setter
    def dispense(self, new_val: float):
        self._instr.set_flow_rate(
            dispense=_assert_gzero(
                new_val, "flow rate should be a numerical value in ul/s"
            )
        )

    @property
    def blow_out(self) -> float:
        return self._instr.get_pipette()["blow_out_flow_rate"]

    @blow_out.setter
    def blow_out(self, new_val: float):
        self._instr.set_flow_rate(
            blow_out=_assert_gzero(
                new_val, "flow rate should be a numerical value in ul/s"
            )
        )


def _find_value_for_api_version(
    for_version: APIVersion, values: Dict[str, float]
) -> float:
    """
    Parse a dict that looks like
    {"2.0": 5,
    "2.5": 4}
    (aka the flow rate values from pipette config) and return the value for
    the highest api level that is at or underneath ``for_version``
    """
    sorted_versions = sorted({APIVersion.from_string(k): v for k, v in values.items()})
    last = values[str(sorted_versions[0])]
    for version in sorted_versions:
        if version > for_version:
            break
        last = values[str(version)]
    return last


class PlungerSpeeds:
    """Utility class for rich setters/getters for speeds"""

    def __init__(self, instr: AbstractInstrument) -> None:
        self._instr = instr

    @property
    def aspirate(self) -> float:
        return self._instr.get_pipette()["aspirate_speed"]

    @aspirate.setter
    def aspirate(self, new_val: float):
        self._instr.set_pipette_speed(
            aspirate=_assert_gzero(new_val, "speed should be a numerical value in mm/s")
        )

    @property
    def dispense(self) -> float:
        return self._instr.get_pipette()["dispense_speed"]

    @dispense.setter
    def dispense(self, new_val: float):
        self._instr.set_pipette_speed(
            dispense=_assert_gzero(new_val, "speed should be a numerical value in mm/s")
        )

    @property
    def blow_out(self) -> float:
        return self._instr.get_pipette()["blow_out_speed"]

    @blow_out.setter
    def blow_out(self, new_val: float):
        self._instr.set_pipette_speed(
            blow_out=_assert_gzero(new_val, "speed should be a numerical value in mm/s")
        )


class Clearances:
    def __init__(self, default_aspirate: float, default_dispense: float) -> None:
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
    """Special mapping allowing internal storage by Mount enums and
    user access by string
    """

    def __getitem__(self, key: Union[str, Axis]):
        checked_key = AxisMaxSpeeds._verify_key(key)
        return self.data[checked_key]

    @staticmethod
    def _verify_key(key: Any) -> Axis:
        if isinstance(key, Axis):
            checked_key: Optional[Axis] = key
        elif isinstance(key, str):
            checked_key = Axis[key.upper()]
        else:
            checked_key = None
        if checked_key not in Axis.gantry_axes():
            raise KeyError(key)
        return checked_key

    def __setitem__(self, key: Any, value: Any):
        if value is None:
            del self[key]
            return

        checked_key = AxisMaxSpeeds._verify_key(key)
        checked_val = _assert_gzero(
            value, "max speeds should be numerical values in mm/s"
        )

        self.data[checked_key] = checked_val

    def __delitem__(self, key: Union[str, Axis]):
        checked_key = AxisMaxSpeeds._verify_key(key)
        del self.data[checked_key]

    def __iter__(self):
        """keys() and dict iteration return string keys"""
        return (k.name for k in self.data.keys())

    def keys(self):
        return (k.name for k in self.data.keys())

    def items(self):
        return ((k.name, v) for k, v in self.data.items())


def clamp_value(
    input_value: float, max_value: float, min_value: float, log_tag: str = ""
) -> float:
    if input_value > max_value:
        MODULE_LOG.info(f"{log_tag} clamped input {input_value} to {max_value}")
        return max_value
    if input_value < min_value:
        MODULE_LOG.info(f"{log_tag} clamped input {input_value} to {min_value}")
        return min_value
    return input_value


FuncT = TypeVar("FuncT", bound=Callable[..., Any])


def requires_version(major: int, minor: int) -> Callable[[FuncT], FuncT]:
    """Decorator. Apply to Protocol API methods or attributes to indicate
    the first version in which the method or attribute was present.
    """

    def _set_version(decorated_obj: FuncT) -> FuncT:
        added_version = APIVersion(major, minor)
        setattr(decorated_obj, "__opentrons_version_added", added_version)
        if hasattr(decorated_obj, "__doc__"):
            # Add the versionadded stanza to everything decorated if we can
            docstr = decorated_obj.__doc__ or ""
            # this newline and initial space has to be there for sphinx to
            # parse this correctly and not add it into for instance a
            # previous code-block
            docstr += f"\n\n        .. versionadded:: {added_version}\n\n"
            decorated_obj.__doc__ = docstr

        @functools.wraps(decorated_obj)
        def _check_version_wrapper(*args: Any, **kwargs: Any) -> Any:
            slf = args[0]
            added_in = decorated_obj.__opentrons_version_added  # type: ignore
            current_version = slf._api_version

            if APIVersion(2, 0) <= current_version < added_in:
                # __qualname__ is *probably* set on every kind of object we care
                # about, but the docs leave it ambiguous, so fall back to str().
                name = getattr(decorated_obj, "__qualname__", str(decorated_obj))

                raise APIVersionError(
                    f"{name} was added in {added_in}, but your "
                    f"protocol requested version {current_version}. You "
                    f"must increase your API version to {added_in} to "
                    "use this functionality."
                )
            return decorated_obj(*args, **kwargs)

        return cast(FuncT, _check_version_wrapper)

    return _set_version


class ModifiedList(list):
    def __contains__(self, item):
        for name in self:
            if name == item.replace("-", "_").lower():
                return True
        return False
