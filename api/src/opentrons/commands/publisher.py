import functools
import inspect
from opentrons.broker import Broker
from . import types as command_types


class CommandPublisher:
    def __init__(self, broker):
        self._broker = broker or Broker()

    @property
    def broker(self):
        return self._broker

    @broker.setter
    def broker(self, broker):
        self._broker = broker


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
