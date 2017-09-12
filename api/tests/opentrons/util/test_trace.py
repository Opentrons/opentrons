import unittest
from opentrons.util.testing.fixtures import robot, message_broker
from opentrons.pubsub_util import topics
from opentrons.util.trace import (
    MessageBroker,
    traceable
)
from opentrons.pubsub_util import topics


def test_subscription(message_broker):
    def test():
        pass
    message_broker.subscribe(topics.MISC, test)
    assert topics.MISC in message_broker.topics_and_funcs
    assert test in message_broker.topics_and_funcs[topics.MISC]

def test_single_publish(message_broker):
    message = "tester message!"
    test_check = False
    def test(rcv_msg):
        nonlocal test_check
        if message == rcv_msg:
            test_check = True
    message_broker.subscribe(topics.MISC, test)
    message_broker.publish(topics.MISC, message)
    assert test_check

def test_publish_to_multiple_subscribers(message_broker):
    message = "tester message!"
    test_check1, test_check2 = False, False
    def test1(rcv_msg):
        nonlocal test_check1
        if message == rcv_msg:
            test_check1 = True

    def test2(rcv_msg):
        nonlocal test_check2
        if message == rcv_msg:
            test_check2 = True
    message_broker.subscribe(topics.MISC, test1)
    message_broker.subscribe(topics.MISC, test2)
    message_broker.publish(topics.MISC, message)
    assert test_check1 and test_check2
