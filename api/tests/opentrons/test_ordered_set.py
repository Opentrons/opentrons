"""Tests for ordered_set."""


import pytest
from opentrons.ordered_set import OrderedSet


def test_addition_and_iteration() -> None:
    """Elements should be returned in the order they were added."""
    subject = OrderedSet[int]()
    expected = list(range(100))
    for element in expected:
        subject.add(element)
    assert list(subject) == expected


def test_equality() -> None:
    """Sets should be equal only with the same elements in the same order."""
    subject_123 = OrderedSet[int]()
    subject_123.add(1)
    subject_123.add(2)
    subject_123.add(3)

    subject_123_also = OrderedSet[int]()
    subject_123_also.add(1)
    subject_123_also.add(2)
    subject_123_also.add(3)

    subject_123_float = OrderedSet[float]()
    subject_123_float.add(1.0)
    subject_123_float.add(2.0)
    subject_123_float.add(3.0)

    subject_123_str = OrderedSet[str]()
    subject_123_str.add("1")
    subject_123_str.add("2")
    subject_123_str.add("3")

    subject_456 = OrderedSet[int]()
    subject_456.add(4)
    subject_456.add(5)
    subject_456.add(6)

    subject_321 = OrderedSet[int]()
    subject_321.add(3)
    subject_321.add(2)
    subject_321.add(1)

    not_even_an_ordered_set = "💩"

    assert subject_123 == subject_123_also
    assert subject_123 == subject_123_float
    assert subject_123 != subject_123_str
    assert subject_123 != subject_456
    assert subject_123 != subject_321
    assert subject_123 != not_even_an_ordered_set


def test_deduplication() -> None:
    """Added elements should be deduplicated."""
    subject = OrderedSet[int]()
    for i in [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9]:
        subject.add(i)
    assert list(subject) == [3, 1, 4, 5, 9, 2, 6, 8, 7]


def test_initialization_by_iterable() -> None:
    """Initializing by iterable should be equivalent to adding one at a time."""
    source_iterable = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9]
    subject_1 = OrderedSet[int](source_iterable)
    subject_2 = OrderedSet[int]()
    for element in source_iterable:
        subject_2.add(element)

    assert subject_1 == subject_2


def test_remove() -> None:
    """It should remove the element from the set, or raise if it's not present."""
    subject = OrderedSet([1, 2, 3, 4, 5])

    subject.remove(2)
    assert list(subject) == [1, 3, 4, 5]

    with pytest.raises(KeyError):
        subject.remove(2)
    assert list(subject) == [1, 3, 4, 5]


def test_discard() -> None:
    """It should remove the element from the set, or noop if it's not present."""
    subject = OrderedSet([1, 2, 3, 4, 5])

    subject.discard(2)
    assert list(subject) == [1, 3, 4, 5]

    subject.discard(2)  # Should just noop
    assert list(subject) == [1, 3, 4, 5]


def test_length() -> None:
    """The length should be the number of unique elements currently in the set."""
    subject = OrderedSet[str]()
    assert len(subject) == 0

    subject.add("a")
    assert len(subject) == 1

    subject.add("a")  # Duplicate.
    assert len(subject) == 1

    subject.add("b")
    assert len(subject) == 2

    subject.remove("a")
    assert len(subject) == 1


def test_clear() -> None:
    """It should clear all elements from the set."""
    subject = OrderedSet([1, 2, 3, 4, 5])
    subject.clear()
    assert list(subject) == []


def test_head() -> None:
    """It should return the head of the set."""
    subject = OrderedSet([1, 2])

    assert subject.head() == 1
    subject.remove(1)

    assert subject.head() == 2
    subject.remove(2)

    with pytest.raises(IndexError):
        subject.head()

    assert subject.head(default_value=42) == 42


def test_difference() -> None:
    """It should return the set difference, preserving order."""
    a = OrderedSet([3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9])
    b = {1, 9}

    assert (a - OrderedSet(b)) == (a - b) == OrderedSet([3, 4, 5, 2, 6, 5, 3, 5, 8, 7])
