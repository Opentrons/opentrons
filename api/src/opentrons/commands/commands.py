from datetime import timedelta
from . import types as command_types
from opentrons.broker import Broker

import functools
import inspect
from typing import Union, Sequence, List, Any, Optional, TYPE_CHECKING

from opentrons.legacy_api.containers import (Well as OldWell,
                                             Container as OldContainer,
                                             Slot as OldSlot,
                                             location_to_list)
from opentrons.protocol_api.labware import Well, Labware
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons.protocols.api_support.util import FlowRates
from opentrons.types import Location
from opentrons.drivers import utils

if TYPE_CHECKING:
    from opentrons.protocol_api.instrument_context import InstrumentContext


Apiv2Locations = Sequence[Union[Location, Well]]
Apiv2Instruments = Sequence['InstrumentContext']


def is_new_loc(location: Union[Location, Well, None,
                               OldWell, OldContainer,
                               OldSlot, Sequence]) -> bool:
    return isinstance(listify(location)[0], (Location, Well))


def listify(location: Any) -> List:
    if isinstance(location, list):
        try:
            return listify(location[0])
        except IndexError:
            return [location]
    else:
        return [location]


class CommandPublisher:
    def __init__(self, broker):
        self._broker = broker or Broker()

    @property
    def broker(self):
        return self._broker

    @broker.setter
    def broker(self, broker):
        self._broker = broker


def _stringify_new_loc(loc: Union[Location, Well]) -> str:
    if isinstance(loc, Location):
        if isinstance(loc.labware, str):
            return loc.labware
        elif isinstance(loc.labware, (Labware, Well, ModuleGeometry)):
            return repr(loc.labware)
        else:
            return str(loc.point)
    elif isinstance(loc, Well):
        return str(loc)
    else:
        raise TypeError(loc)


def _stringify_legacy_loc(loc: Union[OldWell, OldContainer,
                                     OldSlot, None]) -> str:
    def get_slot(location):
        trace = location.get_trace()
        for item in trace:
            if isinstance(item, OldSlot):
                return item.get_name()
            elif isinstance(item, str):
                return item
        return '?'

    type_to_text = {
        OldSlot: 'slot',
        OldContainer: 'container',
        OldWell: 'well',
    }

    # Coordinates only
    if loc is None:
        return '?'

    location = location_to_list(loc)
    multiple = len(location) > 1

    return '{object_text}{suffix} {first}{last} in "{slot_text}"'.format(
            object_text=type_to_text[type(location[0])],
            suffix='s' if multiple else '',
            first=location[0].get_name(),
            last='...'+location[-1].get_name() if multiple else '',
            slot_text=get_slot(location[0])
        )


def combine_locations(location: Sequence) -> str:
    if len(location) > 1:
        loc1 = stringify_location(location[0])
        loc2 = stringify_location(location[1])
        return f'{loc1} and {loc2}'
    elif len(location) == 1:
        loc1 = stringify_location(location[0])
        return f'{loc1}'
    else:
        return ''


def stringify_location(location: Union[Location, None,
                                       OldWell, OldContainer,
                                       OldSlot, Sequence]) -> str:
    if is_new_loc(location):
        loc_str_list = [_stringify_new_loc(loc)
                        for loc in listify(location)]
        return ', '.join(loc_str_list)
    else:
        return _stringify_legacy_loc(location)  # type: ignore


def make_command(name, payload):
    return {'name': name, 'payload': payload}


def home(mount):
    text = 'Homing pipette plunger on mount {mount}'.format(mount=mount)
    return make_command(
        name=command_types.HOME,
        payload={
            'axis': mount,
            'text': text
        }
    )


def aspirate(instrument, volume, location, rate):
    location_text = stringify_location(location)
    template = 'Aspirating {volume} uL from {location} at {flow} uL/sec'
    try:
        flow_rate = rate * FlowRates(instrument).aspirate
        text = template.format(
                volume=float(volume), location=location_text, flow=flow_rate)
    except AttributeError:
        flow_mms = instrument.speeds['aspirate']
        flow_ulsec = flow_mms * instrument._ul_per_mm(instrument.max_volume,
                                                      'aspirate')
        flow_rate = rate * flow_ulsec
        flow_rate = round(flow_rate, 1)
        text = template.format(
                volume=float(volume), location=location_text, flow=flow_rate)

    return make_command(
        name=command_types.ASPIRATE,
        payload={
            'instrument': instrument,
            'volume': volume,
            'location': location,
            'rate': rate,
            'text': text
        }
    )


def paired_aspirate(
        instruments: Apiv2Instruments, volume: float,
        locations: Apiv2Locations, rate: float,
        pub_type: str):
    loc_text = combine_locations(locations)
    flow_rate = min(
        rate * FlowRates(instr).aspirate for instr in instruments)
    text_type = f'{pub_type}: Aspirating '
    text_content = f'{volume} uL from {loc_text} at {flow_rate} uL/sec'
    text = text_type + text_content
    return make_command(
        name=command_types.ASPIRATE,
        payload={
            'instruments': instruments,
            'volume': volume,
            'locations': locations,
            'rate': rate,
            'text': text
        }
    )


def dispense(instrument, volume, location, rate):
    location_text = stringify_location(location)
    template = 'Dispensing {volume} uL into {location} at {flow} uL/sec'
    try:
        flow_rate = rate * FlowRates(instrument).dispense
        text = template.format(
                volume=float(volume), location=location_text, flow=flow_rate)
    except AttributeError:
        flow_mms = instrument.speeds['dispense']
        flow_ulsec = flow_mms * instrument._ul_per_mm(instrument.max_volume,
                                                      'dispense')
        flow_rate = rate * flow_ulsec
        flow_rate = round(flow_rate, 1)
        text = template.format(
                volume=float(volume), location=location_text, flow=flow_rate)

    return make_command(
        name=command_types.DISPENSE,
        payload={
            'instrument': instrument,
            'volume': volume,
            'location': location,
            'rate': rate,
            'text': text
        }
    )


def paired_dispense(
        instruments: Apiv2Instruments, volume: float,
        locations: Apiv2Locations, rate: float,
        pub_type: str):
    loc_text = combine_locations(locations)
    flow_rate = min(
        rate * FlowRates(instr).dispense for instr in instruments)
    text_type = f'{pub_type}: Dispensing '
    text_content = f'{volume} uL into {loc_text} at {flow_rate} uL/sec'
    text = text_type + text_content
    return make_command(
        name=command_types.ASPIRATE,
        payload={
            'instruments': instruments,
            'volume': volume,
            'locations': locations,
            'rate': rate,
            'text': text
        }
    )


def consolidate(instrument, volume, source, dest):
    text = 'Consolidating {volume} from {source} to {dest}'.format(
        volume=transform_volumes(volume),
        source=stringify_location(source),
        dest=stringify_location(dest)
    )
    if is_new_loc(source):
        # Dest is assumed as new location too
        locations = [] + listify(source) + listify(dest)
    else:
        # incase either source or dest is list of tuple location
        # strip both down to simply lists of Placeables
        locations = [] + location_to_list(source) + location_to_list(dest)
    return make_command(
        name=command_types.CONSOLIDATE,
        payload={
            'instrument': instrument,
            'locations': locations,
            'volume': volume,
            'source': source,
            'dest': dest,
            'text': text
        }
    )


def distribute(instrument, volume, source, dest):
    text = 'Distributing {volume} from {source} to {dest}'.format(
        volume=transform_volumes(volume),
        source=stringify_location(source),
        dest=stringify_location(dest)
    )
    if is_new_loc(source):
        # Dest is assumed as new location too
        locations = [] + listify(source) + listify(dest)
    else:
        # incase either source or dest is list of tuple location
        # strip both down to simply lists of Placeables
        locations = [] + location_to_list(source) + location_to_list(dest)
    return make_command(
        name=command_types.DISTRIBUTE,
        payload={
            'instrument': instrument,
            'locations': locations,
            'volume': volume,
            'source': source,
            'dest': dest,
            'text': text
        }
    )


def transfer(instrument, volume, source, dest):
    text = 'Transferring {volume} from {source} to {dest}'.format(
        volume=transform_volumes(volume),
        source=stringify_location(source),
        dest=stringify_location(dest)
    )
    if is_new_loc(source):
        # Dest is assumed as new location too
        locations = [] + listify(source) + listify(dest)
    else:
        # incase either source or dest is list of tuple location
        # strip both down to simply lists of Placeables
        locations = [] + location_to_list(source) + location_to_list(dest)
    return make_command(
        name=command_types.TRANSFER,
        payload={
            'instrument': instrument,
            'locations': locations,
            'volume': volume,
            'source': source,
            'dest': dest,
            'text': text
        }
    )


def comment(msg):
    text = msg
    return make_command(
        name=command_types.COMMENT,
        payload={
            'text': text
        }
    )


def transform_volumes(volumes):
    if not isinstance(volumes, list):
        return float(volumes)
    else:
        return [float(vol) for vol in volumes]


def mix(instrument, repetitions, volume, location):
    text = 'Mixing {repetitions} times with a volume of {volume} ul'.format(
        repetitions=repetitions, volume=float(volume)
    )
    return make_command(
        name=command_types.MIX,
        payload={
            'instrument': instrument,
            'location': location,
            'volume': volume,
            'repetitions': repetitions,
            'text': text
        }
    )


def paired_mix(
        instruments: Apiv2Instruments, locations: Apiv2Locations,
        repetitions: int, volume: float, pub_type: str):
    text_type = f'{pub_type}: Mixing '
    text_content = '{repetitions} times with a volume of {volume} ul'
    text = text_type + text_content
    return make_command(
        name=command_types.MIX,
        payload={
            'instruments': instruments,
            'locations': locations,
            'volume': volume,
            'repetitions': repetitions,
            'text': text
        }
    )


def blow_out(instrument, location):
    location_text = stringify_location(location)
    text = 'Blowing out'

    if location is not None:
        text += ' at {location}'.format(location=location_text)

    return make_command(
        name=command_types.BLOW_OUT,
        payload={
            'instrument': instrument,
            'location': location,
            'text': text
        }
    )


def paired_blow_out(
        instruments: Apiv2Instruments,
        locations: Optional[Apiv2Locations],
        pub_type: str):
    text = f'{pub_type}: Blowing out'

    if locations is not None:
        location_text = combine_locations(locations)
        text += f' at {location_text}'

    return make_command(
        name=command_types.BLOW_OUT,
        payload={
            'instruments': instruments,
            'locations': locations,
            'text': text
        }
    )


def touch_tip(instrument):
    text = 'Touching tip'

    return make_command(
        name=command_types.TOUCH_TIP,
        payload={
            'instrument': instrument,
            'text': text
        }
    )


def paired_touch_tip(
        instruments: Apiv2Instruments,
        locations: Optional[Apiv2Locations],
        pub_type: str):
    text = f'{pub_type}: Touching tip'

    if locations is not None:
        location_text = combine_locations(locations)
        text += f' at {location_text}'
    return make_command(
        name=command_types.TOUCH_TIP,
        payload={
            'instruments': instruments,
            'locations': locations,
            'text': text
        }
    )


def air_gap():
    text = 'Air gap'
    return make_command(
        name=command_types.AIR_GAP,
        payload={
            'text': text
        }
    )


def return_tip():
    text = 'Returning tip'
    return make_command(
        name=command_types.RETURN_TIP,
        payload={
            'text': text
        }
    )


def pick_up_tip(instrument, location):
    location_text = stringify_location(location)
    text = 'Picking up tip from {location}'.format(location=location_text)
    return make_command(
        name=command_types.PICK_UP_TIP,
        payload={
            'instrument': instrument,
            'location': location,
            'text': text
        }
    )


def paired_pick_up_tip(
        instruments: Apiv2Instruments,
        locations: Apiv2Locations, pub_type: str):
    location_text = combine_locations(locations)
    text = f'{pub_type}: Picking up tip from {location_text}'
    return make_command(
        name=command_types.PICK_UP_TIP,
        payload={
            'instruments': instruments,
            'locations': locations,
            'text': text
        }
    )


def drop_tip(instrument, location):
    location_text = stringify_location(location)
    text = 'Dropping tip into {location}'.format(location=location_text)
    return make_command(
        name=command_types.DROP_TIP,
        payload={
            'instrument': instrument,
            'location': location,
            'text': text
        }
    )


def paired_drop_tip(
        instruments: Apiv2Instruments,
        locations: Apiv2Locations, pub_type: str):
    location_text = combine_locations(locations)
    text = f'{pub_type}: Dropping tip into {location_text}'
    return make_command(
        name=command_types.DROP_TIP,
        payload={
            'instruments': instruments,
            'locations': locations,
            'text': text
        }
    )


def magdeck_engage():
    text = "Engaging Magnetic Module"
    return make_command(
        name=command_types.MAGDECK_ENGAGE,
        payload={'text': text}
    )


def magdeck_disengage():
    text = "Disengaging Magnetic Module"
    return make_command(
        name=command_types.MAGDECK_DISENGAGE,
        payload={'text': text}
    )


def magdeck_calibrate():
    text = "Calibrating Magnetic Module"
    return make_command(
        name=command_types.MAGDECK_CALIBRATE,
        payload={'text': text}
    )


def tempdeck_set_temp(celsius):
    text = "Setting Temperature Module temperature " \
           "to {temp} °C (rounded off to nearest integer)".format(
            temp=round(float(celsius),
                       utils.TEMPDECK_GCODE_ROUNDING_PRECISION))
    return make_command(
        name=command_types.TEMPDECK_SET_TEMP,
        payload={
            'celsius': celsius,
            'text': text
        }
    )


def tempdeck_await_temp(celsius):
    text = "Waiting for Temperature Module to reach temperature " \
           "{temp} °C (rounded off to nearest integer)".format(
            temp=round(float(celsius),
                       utils.TEMPDECK_GCODE_ROUNDING_PRECISION))
    return make_command(
        name=command_types.TEMPDECK_AWAIT_TEMP,
        payload={
            'celsius': celsius,
            'text': text
        }
    )


def tempdeck_deactivate():
    text = "Deactivating Temperature Module"
    return make_command(
        name=command_types.TEMPDECK_DEACTIVATE,
        payload={'text': text}
    )


def thermocycler_open():
    text = "Opening Thermocycler lid"
    return make_command(
        name=command_types.THERMOCYCLER_OPEN,
        payload={'text': text}
    )


def thermocycler_set_block_temp(temperature,
                                hold_time_seconds,
                                hold_time_minutes):
    temp = round(float(temperature), utils.TC_GCODE_ROUNDING_PRECISION)
    text = f'Setting Thermocycler well block temperature to {temp} °C'
    total_seconds = None
    # TODO: BC 2019-09-05 this time resolving logic is partially duplicated
    # in the thermocycler api class definition, with this command logger
    # implementation, there isn't a great way to avoid this, but it should
    # be consolidated as soon as an alternative to the publisher is settled on.
    if hold_time_seconds or hold_time_minutes:
        given_seconds = hold_time_seconds or 0
        given_minutes = hold_time_minutes or 0
        total_seconds = given_seconds + (given_minutes * 60)

        clean_seconds = total_seconds % 60
        clean_minutes = (total_seconds - clean_seconds) / 60
        text += ' with a hold time of '
        if clean_minutes > 0:
            text += f'{clean_minutes} minutes and '
        text += f'{clean_seconds} seconds'
    return make_command(
        name=command_types.THERMOCYCLER_SET_BLOCK_TEMP,
        payload={
            'temperature': temperature,
            'hold_time': total_seconds,
            'text': text
        }
    )


def thermocycler_execute_profile(steps, repetitions):
    text = f'Thermocycler starting {repetitions} repetitions' \
            ' of cycle composed of the following steps: {steps}'
    return make_command(
        name=command_types.THERMOCYCLER_EXECUTE_PROFILE,
        payload={
            'text': text,
            'steps': steps
        }
    )


def thermocycler_wait_for_hold():
    text = "Waiting for hold time duration"
    return make_command(
        name=command_types.THERMOCYCLER_WAIT_FOR_HOLD,
        payload={'text': text}
    )


def thermocycler_wait_for_temp():
    text = "Waiting for Thermocycler to reach target"
    return make_command(
        name=command_types.THERMOCYCLER_WAIT_FOR_TEMP,
        payload={'text': text}
    )


def thermocycler_set_lid_temperature(temperature):
    temp = round(float(temperature), utils.TC_GCODE_ROUNDING_PRECISION)
    text = f'Setting Thermocycler lid temperature to {temp} °C'
    return make_command(
        name=command_types.THERMOCYCLER_SET_LID_TEMP,
        payload={'text': text}
    )


def thermocycler_deactivate_lid():
    text = "Deactivating Thermocycler lid heating"
    return make_command(
        name=command_types.THERMOCYCLER_DEACTIVATE_LID,
        payload={'text': text}
    )


def thermocycler_deactivate_block():
    text = "Deactivating Thermocycler well block heating"
    return make_command(
        name=command_types.THERMOCYCLER_DEACTIVATE_BLOCK,
        payload={'text': text}
    )


def thermocycler_deactivate():
    text = "Deactivating Thermocycler"
    return make_command(
        name=command_types.THERMOCYCLER_DEACTIVATE,
        payload={'text': text}
    )


def thermocycler_wait_for_lid_temp():
    text = "Waiting for Thermocycler lid to reach target temperature"
    return make_command(
        name=command_types.THERMOCYCLER_WAIT_FOR_LID_TEMP,
        payload={'text': text}
    )


def thermocycler_close():
    text = "Closing Thermocycler lid"
    return make_command(
        name=command_types.THERMOCYCLER_CLOSE,
        payload={'text': text}
    )


def delay(seconds, minutes, msg=None):
    td = timedelta(minutes=minutes, seconds=seconds)
    minutes, seconds = divmod(td.seconds, 60)

    text = f"Delaying for {minutes} minutes and {seconds} seconds"
    if msg:
        text = f"{text}. {msg}"
    return make_command(
        name=command_types.DELAY,
        payload={
            'minutes': minutes,
            'seconds': seconds,
            'text': text
        }
    )


def pause(msg):
    text = 'Pausing robot operation'
    if msg:
        text = text + ': {}'.format(msg)
    return make_command(
        name=command_types.PAUSE,
        payload={
            'text': text,
            'userMessage': msg,
        }
    )


def resume():
    return make_command(
        name=command_types.RESUME,
        payload={
            'text': 'Resuming robot operation'
        }
    )


def do_publish(broker, cmd, f, when, res, meta, *args, **kwargs):
    """ Implement the publish so it can be called outside the decorator """
    publish_command = functools.partial(
        broker.publish,
        topic=command_types.COMMAND)
    call_args = _get_args(f, args, kwargs)
    if when == 'before':
        broker.logger.info("{}: {}".format(
            f.__qualname__,
            {k: v for k, v in call_args.items() if str(k) != 'self'}))
    command_args = dict(
        zip(
            reversed(inspect.getfullargspec(cmd).args),
            reversed(inspect.getfullargspec(cmd).defaults
                     or [])))

    # TODO (artyom, 20170927): we are doing this to be able to use
    # the decorator in Instrument class methods, in which case
    # self is effectively an instrument.
    # To narrow the scope of this hack, we are checking if the
    # command is expecting instrument first.
    if 'instrument' in inspect.getfullargspec(cmd).args:
        # We are also checking if call arguments have 'self' and
        # don't have instruments specified, in which case
        # instruments should take precedence.
        if 'instrument' not in call_args and 'self' in call_args:
            call_args['instrument'] = call_args['self']

    command_args.update({
        key: call_args[key]
        for key in
        (set(inspect.getfullargspec(cmd).args)
         & call_args.keys())
    })

    if meta:
        command_args['meta'] = meta

    payload = cmd(**command_args)

    message = {**payload, '$': when}
    if when == 'after':
        message['return'] = res
    publish_command(
        message={**payload, '$': when})


def publish_paired(broker, cmd, when, res, *args, pub_type='Paired Pipettes'):
    """ Implement a second publisher outside of the decorator that
    relies on the method providing all of the arguments required
    rather than binding defaults to the signature"""
    publish_command = functools.partial(
        broker.publish,
        topic=command_types.COMMAND)

    payload = cmd(*args, pub_type)

    message = {**payload, '$': when}
    if when == 'after':
        message['return'] = res

    publish_command(message=message)


def _publish_dec(before, after, command, meta=None):
    def decorator(f):
        @functools.wraps(f, updated=functools.WRAPPER_UPDATES+('__globals__',))
        def decorated(*args, **kwargs):
            try:
                broker = args[0].broker
            except AttributeError:
                raise RuntimeError("Only methods of CommandPublisher \
                    classes should be decorated.")
            if before:
                do_publish(
                    broker, command, f, 'before', None, meta, *args, **kwargs)
            res = f(*args, **kwargs)
            if after:
                do_publish(
                    broker, command, f, 'after', res, meta, *args, **kwargs)
            return res
        return decorated

    return decorator


class publish:
    """ Class that allows namespaced decorators with valid mypy types

    These were previously defined by adding them as attributes to the
    publish function, which is not currently supported by mypy:
    https://github.com/python/mypy/issues/2087

    Making a simple class with these as attributes does the same thing
    but in a way that mypy can actually verify.

    Only commands inheriting from class CommandPublisher should contain
    decorators.
    """
    before = functools.partial(_publish_dec, before=True, after=False)
    after = functools.partial(_publish_dec, before=False, after=True)
    both = functools.partial(_publish_dec, before=True, after=True)


def _get_args(f, args, kwargs):
    # Create the initial dictionary with args that have defaults
    res = {}
    sig = inspect.signature(f)
    if inspect.ismethod(f) and args[0] is f.__self__:
        args = args[1:]
    if inspect.ismethod(f):
        res['self'] = f.__self__

    bound = sig.bind(*args, **kwargs)
    bound.apply_defaults()
    res.update(bound.arguments)
    return res
