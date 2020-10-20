"""Unit tests for queue_entry module."""
from typing import List

import pytest
from notify_server.clients.queue_entry import QueueEntry, MalformedFrames
from notify_server.models.event import Event


def test_entry_to_frames(event: Event) -> None:
    """Test that to frames method creates a list of byte frames."""
    entry = QueueEntry("topic", event)
    assert entry.to_frames() == [
        b'topic', event.json().encode('utf-8')
    ]


@pytest.mark.parametrize(argnames=["frames"],
                         argvalues=[
                             [[]],
                             [[b"a", b"{"]],
                             [[b"a", b"{}"]]
                         ])
def test_entry_from_frames_fail(frames: List[bytes]) -> None:
    """Test that an exception is raised on bad message."""
    with pytest.raises(MalformedFrames):
        QueueEntry.from_frames(frames)


def test_entry_from_frames(event: Event) -> None:
    """Test that a QueueEntry is created from frames."""
    q_entry = QueueEntry.from_frames([b"topic", event.json().encode('utf-8')])
    assert q_entry == QueueEntry(topic="topic", event=event)
