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
