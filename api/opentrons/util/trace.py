from functools import wraps
import inspect
import tempfile as tmpfs
import os


# TODO: Create a nice logging mechanism looking at messages.
# This mechanism could be a constant write to a file (named using the topic)
#  in the temp_fs that would just write every message. Maybe it would also enumerate them
#  so they could be logically linked together during debugging.

TEMP_FILES_PATH = '/Users/jaredgreene/OpenTrons/opentrons-api/api/opentrons'




class MessageBroker(object):
    _instance = None

    def __init__(self):
        self.topics_and_funcs = {}
        self.topic_temp_files = {}
        self.topic_temp_files['topics']      = tmpfs.NamedTemporaryFile(prefix='Topics_', dir='.')
        self.topic_temp_files['subscribers'] = tmpfs.NamedTemporaryFile(prefix='Subscribers_', dir='.')

    def write_to_temp_file(self, topic, msg):
        file = self.topic_temp_files[topic].file
        file.write((str(msg) + '\n').encode())
        file.flush()

    def subscribe(self, topic, func):
        subscription_info = topic + ': ' + repr(func)
        self.write_to_temp_file('subscribers', subscription_info)
        if topic in self.topics_and_funcs:
            self.topics_and_funcs.get(topic).append(func)
        else:
            self.topics_and_funcs[topic] = [func]
            self.write_to_temp_file('topics', topic)
            self.topic_temp_files[topic] = tmpfs.NamedTemporaryFile(prefix= topic +'_', dir='.')


    def remove(self, topic, func):
        self.listeners[topic].remove(func)

    def publish(self, topic, message):
        if topic not in self.topics_and_funcs:
            return
        self.write_to_temp_file(topic, message)
        for subscriber in self.topics_and_funcs[topic]:
            subscriber(message)


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