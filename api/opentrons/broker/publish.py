from .broker import notify
import functools
import inspect


def _publish(before, after, name, **decorator_kwargs):
    def decorator(f):
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            _args = _get_args(f, args, kwargs)
            _args.update(decorator_kwargs)

            if before:
                notify(name, {**_args, '$': 'before'})

            res = f(*args, **kwargs)

            if after:
                notify(name, {**_args, '$': 'after', 'return': res})

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

before = functools.partial(_publish, before=True, after=False)
after = functools.partial(_publish, before=False, after=True)
both = functools.partial(_publish, before=True, after=True)
