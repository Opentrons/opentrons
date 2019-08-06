from . import types as command_types
from opentrons.broker import Broker

import functools
import inspect
from typing import Union, Sequence, List, Any

from opentrons.legacy_api.containers import (Well as OldWell,
                                             Container as OldContainer,
                                             Slot as OldSlot,
                                             location_to_list)
from opentrons.protocol_api.labware import Well, Labware, ModuleGeometry
from opentrons.types import Location
from opentrons.drivers import utils


def is_new_loc(location: Union[Location, Well, None,
                               OldWell, OldContainer,
                               OldSlot, Sequence]) -> bool:
    return isinstance(listify(location)[0], (Location, Well))


def listify(location: Any) -> List:
    if isinstance(location, list):
        return sum([listify(loc) for loc in location], [])
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
                return item

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
            slot_text=get_slot(location[0]).get_name()
        )


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
    text = 'Aspirating {volume} uL from {location} at {rate} speed'.format(
        volume=volume, location=location_text, rate=rate
    )
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


def dispense(instrument, volume, location, rate):
    location_text = stringify_location(location)
    text = 'Dispensing {volume} uL into {location}'.format(
        volume=volume, location=location_text, rate=rate
    )

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


def consolidate(instrument, volume, source, dest):
    text = 'Consolidating {volume} from {source} to {dest}'.format(
        volume=volume,
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
        volume=volume,
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
        volume=volume,
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


def mix(instrument, repetitions, volume, location):
    text = 'Mixing {repetitions} times with a volume of {volume}ul'.format(
        repetitions=repetitions, volume=volume
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


def touch_tip(instrument):
    text = 'Touching tip'
    return make_command(
        name=command_types.TOUCH_TIP,
        payload={
            'instrument': instrument,
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
    text = 'Picking up tip {location}'.format(location=location_text)
    return make_command(
        name=command_types.PICK_UP_TIP,
        payload={
            'instrument': instrument,
            'location': location,
            'text': text
        }
    )


def drop_tip(instrument, location):
    location_text = stringify_location(location)
    text = 'Dropping tip {location}'.format(location=location_text)
    return make_command(
        name=command_types.DROP_TIP,
        payload={
            'instrument': instrument,
            'location': location,
            'text': text
        }
    )


def magdeck_engage():
    text = "Engaging magnetic deck module"
    return make_command(
        name=command_types.MAGDECK_ENGAGE,
        payload={'text': text}
    )


def magdeck_disengage():
    text = "Disengaging magnetic deck module"
    return make_command(
        name=command_types.MAGDECK_DISENGAGE,
        payload={'text': text}
    )


def magdeck_calibrate():
    text = "Calibrating magnetic deck module"
    return make_command(
        name=command_types.MAGDECK_CALIBRATE,
        payload={'text': text}
    )


def tempdeck_set_temp(celsius):
    text = "Setting temperature deck module temperature " \
           "to {temp} deg. celsius (rounded off to nearest integer)".format(
            temp=round(float(celsius),
                       utils.TEMPDECK_GCODE_ROUNDING_PRECISION))
    return make_command(
        name=command_types.TEMPDECK_SET_TEMP,
        payload={
            'celsius': celsius,
            'text': text
        }
    )


def tempdeck_deactivate():
    text = "Deactivating temperature deck module"
    return make_command(
        name=command_types.TEMPDECK_DEACTIVATE,
        payload={'text': text}
    )


def thermocycler_open():
    text = "Opening thermocycler lid"
    return make_command(
        name=command_types.THERMOCYCLER_OPEN,
        payload={'text': text}
    )


def thermocycler_set_temp(temp, hold_time):
    text = "Setting thermocycler temperature to {temp} deg. celsius ".format(
            temp=temp)
    if hold_time is not None:
        text += " with a hold time of {} seconds".format(hold_time)
    return make_command(
        name=command_types.THERMOCYCLER_SET_TEMP,
        payload={
            'temp': temp,
            'hold_time': hold_time,
            'text': text
        }
    )


def thermocycler_wait_for_hold():
    text = "Waiting for hold time duration"
    return make_command(
        name=command_types.THERMOCYCLER_WAIT_FOR_HOLD,
        payload={'text': text}
    )


def thermocycler_wait_for_temp():
    text = "Waiting for thermocycler to reach target"
    return make_command(
        name=command_types.THERMOCYCLER_WAIT_FOR_TEMP,
        payload={'text': text}
    )


def thermocycler_heat_lid():
    text = "Heating thermocycler lid"
    return make_command(
        name=command_types.THERMOCYCLER_HEAT_LID,
        payload={'text': text}
    )


def thermocycler_stop_lid_heating():
    text = "Deactivating lid heating"
    return make_command(
        name=command_types.THERMOCYCLER_STOP_LID_HEATING,
        payload={'text': text}
    )


def thermocycler_wait_for_lid_temp():
    text = "Waiting for lid to reach target temperature"
    return make_command(
        name=command_types.THERMOCYCLER_WAIT_FOR_LID_TEMP,
        payload={'text': text}
    )


def thermocycler_close():
    text = "Closing thermocycler lid"
    return make_command(
        name=command_types.THERMOCYCLER_CLOSE,
        payload={'text': text}
    )


def thermocycler_deactivate():
    text = "Deactivating thermocycler"
    return make_command(
        name=command_types.THERMOCYCLER_DEACTIVATE,
        payload={'text': text}
    )


def delay(seconds, minutes, msg=None):
    text = "Delaying for {minutes}m {seconds}s"
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
            'text': text
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
        if 'self' in call_args and 'instrument' not in call_args:
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

    if inspect.getfullargspec(f).defaults:
        res = dict(
            zip(
                reversed(inspect.getfullargspec(f).args),
                reversed(inspect.getfullargspec(f).defaults)))

    # Update / insert values for positional args
    res.update(dict(zip(inspect.getfullargspec(f).args, args)))

    # Update it with values for named args
    res.update(kwargs)
    return res
