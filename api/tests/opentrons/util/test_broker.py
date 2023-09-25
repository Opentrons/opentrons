"""Unit tests for `opentrons.util.broker`."""


from typing import List

from opentrons.util.broker import Broker


def test_broker() -> None:
    """Test subscribing, receiving messages, and unsubscribing."""
    subject = Broker[int]()

    received_by_a: List[int] = []
    received_by_b: List[int] = []

    def callback_a(message: int) -> None:
        received_by_a.append(message)

    def callback_b(message: int) -> None:
        received_by_b.append(message)

    subject.publish(1)
    unsubscribe_a = subject.subscribe(callback_a)
    subject.publish(2)
    unsubscribe_b = subject.subscribe(callback_b)
    subject.publish(3)
    unsubscribe_b()
    subject.publish(4)
    unsubscribe_a()
    subject.publish(5)

    assert received_by_a == [2, 3, 4]
    assert received_by_b == [3]
