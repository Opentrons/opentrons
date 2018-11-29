from . import types
from ..broker import broker
import functools
import inspect
from typing import Union

from opentrons.legacy_api.containers import (Well as OldWell,
                                             Container as OldContainer,
                                             Slot as OldSlot,
                                             location_to_list)
from opentrons.protocol_api.labware import Well, Labware, ModuleGeometry
from opentrons.types import Location


def _stringify_new_loc(loc: Location) -> str:
    if isinstance(loc.labware, str):
        return loc.parent
    elif isinstance(loc.labware, (Labware, Well, ModuleGeometry)):
        return repr(loc.labware)
    else:
        return str(loc.point)


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
                                       OldWell, OldContainer, OldSlot]) -> str:
    if isinstance(location, Location):
        return _stringify_new_loc(location)
    else:
        return _stringify_legacy_loc(location)


def make_command(name, payload):
    return {'name': name, 'payload': payload}


def home(mount):
    text = 'Homing pipette plunger on mount {mount}'.format(mount=mount)
    return make_command(
        name=types.HOME,
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
        name=types.ASPIRATE,
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
        name=types.DISPENSE,
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
    # incase either source or dest is list of tuple location
    # strip both down to simply lists of Placeables
    locations = [] + location_to_list(source) + location_to_list(dest)
    return make_command(
        name=types.CONSOLIDATE,
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
    # incase either source or dest is list of tuple location
    # strip both down to simply lists of Placeables
    locations = [] + location_to_list(source) + location_to_list(dest)
    return make_command(
        name=types.DISTRIBUTE,
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
    # incase either source or dest is list of tuple location
    # strip both down to simply lists of Placeables
    locations = [] + location_to_list(source) + location_to_list(dest)
    return make_command(
        name=types.TRANSFER,
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
        name=types.COMMENT,
        payload={
            'text': text
        }
    )


def mix(instrument, repetitions, volume, location):
    text = 'Mixing {repetitions} times with a volume of {volume}ul'.format(
        repetitions=repetitions, volume=volume
    )
    return make_command(
        name=types.MIX,
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
        name=types.BLOW_OUT,
        payload={
            'instrument': instrument,
            'location': location,
            'text': text
        }
    )


def touch_tip(instrument):
    text = 'Touching tip'
    return make_command(
        name=types.TOUCH_TIP,
        payload={
            'instrument': instrument,
            'text': text
        }
    )


def air_gap():
    text = 'Air gap'
    return make_command(
        name=types.AIR_GAP,
        payload={
            'text': text
        }
    )


def return_tip():
    text = 'Returning tip'
    return make_command(
        name=types.RETURN_TIP,
        payload={
            'text': text
        }
    )


def pick_up_tip(instrument, location):
    location_text = stringify_location(location)
    text = 'Picking up tip {location}'.format(location=location_text)
    return make_command(
        name=types.PICK_UP_TIP,
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
        name=types.DROP_TIP,
        payload={
            'instrument': instrument,
            'location': location,
            'text': text
        }
    )


def magdeck_engage():
    text = "Engaging magnetic deck module"
    return make_command(
        name=types.MAGDECK_ENGAGE,
        payload={'text': text}
    )


def magdeck_disengage():
    text = "Disengaging magnetic deck module"
    return make_command(
        name=types.MAGDECK_DISENGAGE,
        payload={'text': text}
    )


def magdeck_calibrate():
    text = "Calibrating magnetic deck module"
    return make_command(
        name=types.MAGDECK_CALIBRATE,
        payload={'text': text}
    )


def tempdeck_set_temp():
    text = "Setting temperature deck module temperature " \
           "(rounded off to nearest integer)"
    return make_command(
        name=types.TEMPDECK_SET_TEMP,
        payload={'text': text}
    )


def tempdeck_deactivate():
    text = "Deactivating temperature deck module"
    return make_command(
        name=types.TEMPDECK_DEACTIVATE,
        payload={'text': text}
    )


def delay(seconds, minutes):
    text = "Delaying for {minutes}m {seconds}s"
    return make_command(
        name=types.DELAY,
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
        name=types.PAUSE,
        payload={
            'text': text
        }
    )


def resume():
    return make_command(
        name=types.RESUME,
        payload={
            'text': 'Resuming robot operation'
        }
    )


def do_publish(cmd, f, when, res, meta, *args, **kwargs):
    """ Implement the publish so it can be called outside the decorator """
    publish_command = functools.partial(
        broker.publish,
        topic=types.COMMAND)
    call_args = _get_args(f, args, kwargs)
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
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            if before:
                do_publish(command, f, 'before', None, meta, *args, **kwargs)
            res = f(*args, **kwargs)
            if after:
                do_publish(command, f, 'after', res, meta, *args, **kwargs)
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
