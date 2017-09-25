from . import types
from ..broker import publish as publish_msg
import functools
import inspect


def drop_coodrinates(location):
    if isinstance(location, tuple):
        return location[0]
    return location


def make_command(name, payload):
    return {'name': name, 'payload': payload}


def home(axis):
    text = 'Homing pipette plunger on axis {axis}'.format(axis=axis)
    return make_command(
        name=types.HOME,
        payload={
            'axis': axis,
            'text': text
        }
    )


def aspirate(volume, location, rate, self):
    location = drop_coodrinates(location)
    text = 'Aspirating {volume} uL from {location} at {rate} speed'.format(
        volume=volume, location=location, rate=rate
    )
    return make_command(
        name=types.ASPIRATE,
        payload={
            'instrument': self,
            'volume': volume,
            'location': location,
            'rate': rate,
            'text': text
        }
    )


def dispense(volume, location, rate, self):
    location = drop_coodrinates(location)
    text = 'Dispensing {volume} uL into {location}'.format(
        volume=volume, location=location, rate=rate
    )

    return make_command(
        name=types.DISPENSE,
        payload={
            'instrument': self,
            'volume': volume,
            'location': location,
            'rate': rate,
            'text': text
        }
    )


def consolidate(volume, source, dest, self):
    text = 'Consolidating {volume} from {source} to {dest}'.format(
        volume=volume,
        source=source,
        dest=dest
    )
    return make_command(
        name=types.CONSOLIDATE,
        payload={
            'instrument': self,
            'locations': [source, dest],
            'volume': volume,
            'source': source,
            'dest': dest,
            'text': text
        }
    )


def distribute(volume, source, dest, self):
    text = 'Distributing {volume} from {source} to {dest}'.format(
        volume=volume,
        source=source,
        dest=dest
    )
    return make_command(
        name=types.DISTRIBUTE,
        payload={
            'instrument': self,
            'locations': [source, dest],
            'volume': volume,
            'source': source,
            'dest': dest,
            'text': text
        }
    )


def transfer(volume, source, dest, self):
    text = 'Transferring {volume} from {source} to {dest}'.format(
        volume=volume,
        source=source,
        dest=dest
    )
    return make_command(
        name=types.TRANSFER,
        payload={
            'instrument': self,
            'locations': [source, dest],
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


def mix(repetitions, volume, location, self):
    text = 'Mixing {repetitions} times with a volume of {volume}ul'.format(
        repetitions=repetitions, volume=volume
    )
    return make_command(
        name=types.MIX,
        payload={
            'instrument': self,
            'location': location,
            'volume': volume,
            'repetitions': repetitions,
            'text': text
        }
    )


def blow_out(location, self):
    location = drop_coodrinates(location)
    text = 'Blowing out'

    if location is not None:
        text += ' at {location}'.format(location=location)

    return make_command(
        name=types.BLOW_OUT,
        payload={
            'instrument': self,
            'location': location,
            'text': text
        }
    )


def touch_tip(self):
    text = 'Touching tip'
    return make_command(
        name=types.TOUCH_TIP,
        payload={
            'instrument': self,
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


def pick_up_tip(location, self):
    location = drop_coodrinates(location)
    text = 'Picking up tip {location}'.format(location=location)
    return make_command(
        name=types.PICK_UP_TIP,
        payload={
            'instrument': self,
            'location': location,
            'text': text
        }
    )


def drop_tip(location, self):
    location = drop_coodrinates(location)
    text = 'Dropping tip {location}'.format(location=location)
    return make_command(
        name=types.DROP_TIP,
        payload={
            'instrument': self,
            'location': location,
            'text': text
        }
    )


def engage(motor):
    text = "Engaging Magbead at mosfet #{motor}"
    return make_command(
        name=types.MAGBEAD_ENGAGE,
        payload={
            'motor': motor,
            'text': text
        }
    )


def disengage(motor):
    text = "Disengaging Magbead at mosfet #{motor}"
    return make_command(
        name=types.MAGBEAD_ENGAGE,
        payload={
            'motor': motor,
            'text': text
        }
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


def magbead():
    pass


magbead.engage = engage
magbead.disengage = disengage
magbead.delay = delay


def publish(before, after, command, meta=None):
    notify_command_topic = functools.partial(publish_msg, topic=types.COMMAND)

    def decorator(f):
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            payload = _get_args(f, args, kwargs)
            command_args = dict(
                zip(
                    reversed(inspect.getargspec(command).args),
                    reversed(inspect.getargspec(command).defaults or [])))

            command_args.update({
                    key: payload[key]
                    for key in
                    set(inspect.getargspec(command).args) & payload.keys()
                })

            if meta:
                command_args['meta'] = meta

            payload = command(**command_args)

            if before:
                notify_command_topic(
                    message={**payload, '$': 'before'})

            res = f(*args, **kwargs)

            if after:
                notify_command_topic(
                    message={**payload, '$': 'after', 'return': res})

            return res
        return decorated

    return decorator


def _get_args(f, args, kwargs):
    # Create the initial dictionary with args that have defaults
    res = {}

    if inspect.getargspec(f).defaults:
        res = dict(
            zip(
                reversed(inspect.getargspec(f).args),
                reversed(inspect.getargspec(f).defaults)))

    # Update / insert values for positional args
    res.update(dict(zip(inspect.getargspec(f).args, args)))

    # Update it with values for named args
    res.update(kwargs)
    return res


publish.before = functools.partial(publish, before=True, after=False)
publish.after = functools.partial(publish, before=False, after=True)
publish.both = functools.partial(publish, before=True, after=True)
