"""Concurrency provider."""

import asyncio

import pytest

from opentrons.protocol_engine.resources import ConcurrencyProvider


@pytest.fixture
def subject() -> ConcurrencyProvider:
    """Creates a concurrency provider."""
    return ConcurrencyProvider()


def test_concurrency_provider_makes_locks(subject: ConcurrencyProvider) -> None:
    """Test concurrency provider makes locks."""
    lock1 = subject.lock_for_group("lock1")
    lock2 = subject.lock_for_group("lock2")
    assert isinstance(lock1, asyncio.Lock)
    assert isinstance(lock2, asyncio.Lock)
    assert lock1 is not lock2


def test_provides_locks_for_groups(subject: ConcurrencyProvider) -> None:
    """Test that lock returns the correct id."""
    lock1 = subject.lock_for_group("lock1")
    lock2 = subject.lock_for_group("lock1")
    assert lock1 is lock2
    assert isinstance(lock1, asyncio.Lock)
