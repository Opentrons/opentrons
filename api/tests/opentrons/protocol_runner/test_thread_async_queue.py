"""Tests for thread_async_queue."""

from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor
from itertools import chain
from typing import List, NamedTuple

import pytest

from opentrons.protocol_runner.thread_async_queue import (
    ThreadAsyncQueue,
    QueueClosed,
)


def test_basic_single_threaded_behavior() -> None:
    """Test basic queue behavior in a single thread."""
    subject = ThreadAsyncQueue[int]()

    with subject:
        subject.put(1)
        subject.put(2)
        subject.put(3)

    # Putting isn't allowed after closing.
    with pytest.raises(QueueClosed):
        subject.put(4)
    with pytest.raises(QueueClosed):
        subject.put(5)

    # Closing isn't allowed after closing.
    with pytest.raises(QueueClosed):
        subject.done_putting()

    # Values are retrieved in order.
    assert [subject.get(), subject.get(), subject.get()] == [1, 2, 3]

    # After retrieving all values, further retrievals raise.
    with pytest.raises(QueueClosed):
        subject.get()
    with pytest.raises(QueueClosed):
        # If closing were naively implemented as a sentinel value being inserted
        # into the queue, it might be that the first get() after the close
        # correctly raises but the second get() doesn't.
        subject.get()


def test_multi_thread_producer_consumer() -> None:
    """Stochastically smoke-test thread safety.

    Use the queue to pass values between threads
    in a multi-producer, multi-consumer setup.
    Verify that all the values make it through in the correct order.
    """
    num_producers = 3
    num_consumers = 3

    producer_ids = list(range(num_producers))

    # The values that each producer will put into the queue.
    # Anecdotally, threads interleave meaningfully with at least 10000 values.
    values_per_producer = list(range(30000))

    all_expected_values = [
        _ProducedValue(producer_id=p, value=v)
        for p in producer_ids
        for v in values_per_producer
    ]

    subject = ThreadAsyncQueue[_ProducedValue]()

    # Run producers concurrently with consumers.
    with ThreadPoolExecutor(max_workers=num_producers + num_consumers) as executor:
        # `with subject` needs to be inside `with ThreadPoolExecutor`
        # to avoid deadlocks in case something in here raises.
        # Consumers need to see the queue closed eventually to terminate,
        # and `with ThreadPoolExecutor` will wait until all threads are terminated
        # before exiting.
        with subject:
            producers = [
                executor.submit(
                    _produce,
                    queue=subject,
                    values=values_per_producer,
                    producer_id=producer_id,
                )
                for producer_id in producer_ids
            ]
            consumers = [
                executor.submit(_consume, queue=subject) for i in range(num_consumers)
            ]

            # Ensure all producers are done before we exit the `with subject` block
            # and close off the queue to further submissions.
            for c in producers:
                c.result()

    consumer_results = [consumer.result() for consumer in consumers]
    all_values = list(chain(*consumer_results))

    # Assert that the total set of consumed values is as expected:
    # No duplicates, no extras, and nothing missing.
    assert sorted(all_values) == sorted(all_expected_values)

    def assert_consumer_result_correctly_ordered(
        consumer_result: List[_ProducedValue],
    ) -> None:
        # Assert that the consumer got values in the order the producer provided them.
        # Allow values from different producers to be interleaved,
        # and tolerate skipped values (assume they were given to a different consumer).

        # [[All consumed from producer 0], [All consumed from producer 1], etc.]
        consumed_values_per_producer = [
            [pv for pv in consumer_result if pv.producer_id == producer_id]
            for producer_id in producer_ids
        ]
        for values_from_single_producer in consumed_values_per_producer:
            assert values_from_single_producer == sorted(values_from_single_producer)

    for consumer_result in consumer_results:
        assert_consumer_result_correctly_ordered(consumer_result)


async def test_async() -> None:
    """Smoke-test async support.

    Use the queue to pass values
    from a single async producer to a single async consumer,
    running concurrently in the same event loop.

    This verifies two things:

    1. That async retrieval returns basically the expected values.
    2. That async retrieval keeps the event loop free while waiting.
       If it didn't, this test would reveal the problem by deadlocking.

    We trust that more complicated multi-producer/multi-consumer interactions
    are covered by the non-async tests.
    """
    expected_values = list(range(1000))

    subject = ThreadAsyncQueue[_ProducedValue]()

    consumer = asyncio.create_task(_consume_async(queue=subject))
    try:
        with subject:
            await _produce_async(queue=subject, values=expected_values, producer_id=0)
    finally:
        consumed = await consumer

    assert consumed == [_ProducedValue(producer_id=0, value=v) for v in expected_values]


class _ProducedValue(NamedTuple):
    producer_id: int
    value: int


def _produce(
    queue: ThreadAsyncQueue[_ProducedValue],
    values: List[int],
    producer_id: int,
) -> None:
    """Put values in the queue, tagged with an ID representing this producer."""
    for v in values:
        queue.put(_ProducedValue(producer_id=producer_id, value=v))


def _consume(queue: ThreadAsyncQueue[_ProducedValue]) -> List[_ProducedValue]:
    """Consume values from the queue indiscriminately until it's closed.

    Return everything consumed, in the order that this function consumed it.
    """
    result = []
    for value in queue.get_until_closed():
        result.append(value)
    return result


async def _produce_async(
    queue: ThreadAsyncQueue[_ProducedValue],
    values: List[int],
    producer_id: int,
) -> None:
    """Like `_produce()`, except yield to the event loop after each insertion."""
    for value in values:
        queue.put(_ProducedValue(producer_id=producer_id, value=value))
        await asyncio.sleep(0)


async def _consume_async(
    queue: ThreadAsyncQueue[_ProducedValue],
) -> List[_ProducedValue]:
    """Like _consume()`, except yield to the event loop while waiting."""
    result = []
    async for value in queue.get_async_until_closed():
        result.append(value)
    return result
