from functools import wraps
import inspect


def traceable(*args):
    def _traceable(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            res = f(*args, **kwargs)
            broker = EventBroker.get_instance()

            # Create the initial dictionary with args that have defaults
            args_dict = {}

            if inspect.getargspec(f).defaults:
                args_dict = dict(
                    zip(
                        reversed(inspect.getargspec(f).args),
                        reversed(inspect.getargspec(f).defaults)))

            # Update / insert values for positional args
            args_dict.update(dict(zip(inspect.getargspec(f).args, args)))

            # Update it with values for named args
            args_dict.update(kwargs)

            # args_dict = {k: str(v) for k, v in args_dict.items()}

            broker.notify({
                'name': name,
                'function': f.__qualname__,
                'arguments': args_dict,
                'result': res
            })
            return res
        return decorated

    if len(args) == 1 and callable(args[0]):
        # No event name override in the args:
        # @traceable
        # def foo()
        f, = args
        name = f.__qualname__
        return _traceable(f)
    else:
        # Event name is overriden:
        # @traceable('event-foo')
        # def foo()
        name, = args
        return _traceable


class EventBroker(object):
    _instance = None

    def __init__(self):
        self.listeners = []

    def add(self, f):
        self.listeners.append(f)

    def remove(self, f):
        self.listeners.remove(f)

    def notify(self, arguments):
        for listener in self.listeners:
            listener(arguments)

    @classmethod
    def get_instance(cls):
        if not cls._instance:
            cls._instance = EventBroker()
        return cls._instance
