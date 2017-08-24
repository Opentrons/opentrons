from functools import wraps
import inspect

class MessageBroker(object):
    _instance = None

    def __init__(self):
        self.topics = {}

    def subscribe(self, topic, func):
        if topic in self.topics:
            self.topics.get(topic).append(func)
        else:
            self.topics[topic] = [func]

    def remove(self, topic, func):
        self.listeners[topic].remove(func)

    def publish(self, topic, message):
        print("Topic: {}\nMessage: {}".format(topic, message))
        if topic not in self.topics:
            print("NO topic ", topic)
            return
        for subscriber in self.topics[topic]:
            subscriber(message)
        print(message)


    @classmethod
    def get_instance(cls):
        if not cls._instance:
            cls._instance = MessageBroker()
        return cls._instance

    def traceable(self, topic, name=None):
        def _traceable(f):
            @wraps(f)
            def decorated(*args, **kwargs):
                res = f(*args, **kwargs)

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

                MessageBroker.get_instance().publish(topic, {
                    'name': name,
                    'function': f.__qualname__,
                    'arguments': args_dict,
                    'result': res
                })
                return res

            return decorated

        name = name or topic
        return _traceable