"""Tests for the analysis memory cache."""
import pytest

from robot_server.protocols.analysis_memcache import MemoryCache


def test_cache_ejects_old_values() -> None:
    """It should eject old values when the size limit is reached."""
    subject = MemoryCache(3, str, str)
    for val in range(4):
        subject.insert(f"key-{val}", f"value-{val}")
    assert not subject.contains("key-0")
    with pytest.raises(KeyError):
        subject.get("key-0")


def test_cache_retains_new_values() -> None:
    """It should not eject new values when the size limit is reached."""
    subject = MemoryCache(3, str, str)
    for val in range(4):
        subject.insert(f"key-{val}", f"value-{val}")
    for val in range(1, 4):
        assert subject.contains(f"key-{val}")
        assert subject.get(f"key-{val}") == f"value-{val}"


def test_cache_removes_values_by_key() -> None:
    """It should eject values when asked for it."""
    subject = MemoryCache(3, str, str)
    for val in range(3):
        subject.insert(f"key-{val}", f"value-{val}")
    subject.remove("key-1")
    assert not subject.contains("key-1")

    # Make sure cache order is updated
    assert subject.contains("key-0") and subject.contains("key-2")
    subject.insert("key-4", "value-4")
    assert subject.contains("key-0")
    subject.insert("key-5", "value-5")
    assert not subject.contains("key-0")
