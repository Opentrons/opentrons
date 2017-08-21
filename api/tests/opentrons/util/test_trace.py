import unittest
from opentrons.util.trace import (
    MessageBroker,
    traceable
)


class TraceTestCase(unittest.TestCase):
    class MyClass(object):
        @traceable('my-event-A')
        def event_A(self, arg1, arg2, arg3='foo'):
            return 100

        @traceable
        def event_B(self, arg1):
            return None

    def setUp(self):
        self.my_object = TraceTestCase.MyClass()
        self.events = []

    def log(self, info):
        self.events.append(info)

    def test_add_listener(self):
        MessageBroker.get_instance().add(self.log)
        expected_results = []

        # Test positional args
        self.my_object.event_A(1, 2)
        expected_results.append({
            'arguments': {
                'arg1': 1,
                'arg2': 2,
                'arg3': 'foo',
                'self': self.my_object
            },
            'name': 'my-event-A',
            'function': 'TraceTestCase.MyClass.event_A',
            'result': 100
        })
        self.assertDictEqual(expected_results[-1], self.events[-1])

        # Test named args
        self.my_object.event_A(arg1=1, arg2=2)
        expected_results.append({
            'arguments': {
                'arg1': 1,
                'arg2': 2,
                'arg3': 'foo',
                'self': self.my_object
            },
            'name': 'my-event-A',
            'function': 'TraceTestCase.MyClass.event_A',
            'result': 100
        })
        self.assertDictEqual(expected_results[-1], self.events[-1])

        # Override defaults, and use mixed positonal/named args
        self.my_object.event_A(1, arg2=2, arg3='bar')
        expected_results.append({
            'arguments': {
                'arg1': 1,
                'arg2': 2,
                'arg3': 'bar',
                'self': self.my_object
            },
            'name': 'my-event-A',
            'function': 'TraceTestCase.MyClass.event_A',
            'result': 100
        })
        self.assertDictEqual(expected_results[-1], self.events[-1])

        # Call event with default name
        self.my_object.event_B(1)
        expected_results.append({
            'arguments': {
                'arg1': 1,
                'self': self.my_object
            },
            'name': 'TraceTestCase.MyClass.event_B',
            'function': 'TraceTestCase.MyClass.event_B',
            'result': None
        })
        self.assertDictEqual(expected_results[-1], self.events[-1])
