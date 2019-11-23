""" Utility functions and classes for the protocol api """
from collections import UserDict, namedtuple
import functools
import logging
from math import sqrt
from typing import Any, Callable, Optional, TYPE_CHECKING, Union, Sequence

from opentrons.protocols.types import APIVersion
from opentrons.hardware_control import types, adapters, API, HardwareAPILike
from opentrons.hardware_control.pipette import MULTI_TIP_Y_OFFSET

if TYPE_CHECKING:
    from .labware import Well
    from .contexts import InstrumentContext

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


class FlowRates:
    """ Utility class for rich setters/getters for flow rates """

    def __init__(self,
                 instr: 'InstrumentContext') -> None:
        self._instr = instr

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
        if key in types.Axis:
            return self.data[key]
        elif isinstance(key, str):
            return self.data[types.Axis[key.upper()]]
        else:
            raise KeyError(key)

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


class HardwareManager:
    def __init__(self, hardware):
        if None is hardware:
            self._is_orig = True
            self._current = adapters.SynchronousAdapter.build(
                API.build_hardware_simulator)
        elif isinstance(hardware, adapters.SynchronousAdapter):
            self._is_orig = False
            self._current = hardware
        else:
            self._is_orig = False
            self._current = adapters.SynchronousAdapter(hardware)

    @property
    def hardware(self):
        return self._current

    def set_hw(self, hardware):
        if self._is_orig:
            self._is_orig = False
            self._current.join()
        if isinstance(hardware, adapters.SynchronousAdapter):
            self._current = hardware
        elif isinstance(hardware, HardwareAPILike):
            self._current = adapters.SynchronousAdapter(hardware)
        else:
            raise TypeError(
                "hardware should be API or synch adapter but is {}"
                .format(hardware))
        return self._current

    def reset_hw(self):
        if self._is_orig:
            self._current.join()
        self._current = adapters.SynchronousAdapter.build(
            API.build_hardware_simulator)
        self._is_orig = True
        return self._current

    def __del__(self):
        orig = getattr(self, '_is_orig', False)
        cur = getattr(self, '_current', None)
        if orig and cur:
            cur.join()


def clamp_value(
        input_value: float, max_value: float, min_value: float,
        log_tag: str = '') -> float:
    if input_value > max_value:
        MODULE_LOG.info(
            f'{log_tag} clamped input {input_value} to {max_value}')
        return max_value
    if input_value < min_value:
        MODULE_LOG.info(
            f'{log_tag} calmped input {input_value} to {min_value}')
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
            docstr += f'\n\n    .. versionadded:: {added_version}\n\n'
            decorated_obj.__doc__ = docstr

        @functools.wraps(decorated_obj)
        def _check_version_wrapper(*args, **kwargs):
            slf = args[0]
            added_in = decorated_obj.__opentrons_version_added
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


def get_multi_well_set(back_well: 'Well',
                       channel_count: int,
                       wells: Sequence['Well'],
                       labware_quirks: Sequence[str]):
    back_x = back_well.top().point.x
    back_y = back_well.top().point.y
    tip_positions = [{'x': back_x, 'y': back_y - (tip_no * MULTI_TIP_Y_OFFSET)}
                     for tip_no in range(channel_count)]

    if 'centerMultichannelOnWells' in labware_quirks:
        tip_span = MULTI_TIP_Y_OFFSET * (channel_count - 1)
        tip_positions = [{**pos, 'y': pos['y'] + (tip_span / 2)}
                         for pos in tip_positions]
    wells_accessed = []
    for position in tip_positions:
        found_well_at_tip = False
        for well in wells:
            x_diff = position['x'] - well.top().point.x
            y_diff = position['y'] - well.top().point.y
            if well._diameter is not None and \
                    sqrt(x_diff**2 + y_diff**2) <= well.diameter / 2:
                    # circular well where tip lies within well radius
                found_well_at_tip = True
                break
            elif well._diameter is None and \
                    abs(x_diff) <= (well._x_dimension / 2) and \
                    abs(y_diff) <= (well._y_dimension / 2):
                # rectangular well where tip lies within well dimensions
                found_well_at_tip = True
                break
        if found_well_at_tip:
            wells_accessed.append(well)
        else:
            return []
    return wells_accessed


def update_well_volumes(target_well: 'Well',
                        volume_delta: float,
                        channel_count: str):
    if channel_count > 1:
        parent = target_well.parent
        well_set = get_multi_well_set(back_well=target_well,
                                      channel_count=channel_count,
                                      wells=parent.wells(),
                                      labware_quirks=parent.quirks())
        if well_set == []:
            MODULE_LOG.warning(
                'cannot update volume of wells effected'
                ' by incompatible multichannel pipette')
        for well in well_set:
            well.volume = well.volume + volume_delta
    else:
        target_well.volume = target_well.volume + volume_delta
