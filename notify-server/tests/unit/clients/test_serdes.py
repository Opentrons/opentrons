"""Unit tests for queue_entry module."""
from typing import List

import pytest
from notify_server.clients.serdes import (
    TopicEvent,
    MalformedFrames,
    to_frames,
    from_frames,
)
from notify_server.models.event import Event


def test_to_frames(event: Event) -> None:
    """Test that to_frames method creates a list of byte frames."""
    assert to_frames(topic="topic", event=event) == [
        b"topic",
        event.json().encode("utf-8"),
    ]


@pytest.mark.parametrize(
    argnames=["frames"], argvalues=[[[]], [[b"a", b"{"]], [[b"a", b"{}"]]]
)
def test_entry_from_frames_fail(frames: List[bytes]) -> None:
    """Test that an exception is raised on bad message."""
    with pytest.raises(MalformedFrames):
        from_frames(frames)


def test_entry_from_frames(event: Event) -> None:
    """Test that an object is created from_frames."""
    entry = from_frames([b"topic", event.json().encode("utf-8")])
    assert entry == TopicEvent(topic="topic", event=event)
