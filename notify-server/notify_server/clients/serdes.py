"""Methods and types for serializing and deserializing frames."""
from __future__ import annotations

from typing import List

from pydantic import BaseModel

from notify_server.models.event import Event


class MalformedFrames(Exception):
    """Exception raised on badly formed frames."""

    pass


class FrameEncodingError(Exception):
    """Exception raise on encoding error."""

    pass


def to_frames(topic: str, event: Event) -> List[bytes]:
    """
    Create zmq frames from members.

    :raises: FrameEncodingError
    """
    try:
        event_json = event.json()
    except (ValueError, TypeError) as e:
        # Could not serialize event to json.
        raise FrameEncodingError() from e

    return [
        bytes(v, "utf-8")
        for v in (
            topic,
            event_json,
        )
    ]


class TopicEvent(BaseModel):
    """An event received by a topic subscriber."""

    topic: str
    event: Event


def from_frames(frames: List[bytes]) -> TopicEvent:
    """
    Create an object from a zmq frame.

    The frame must have two entries: a topic, a json serialized Event
    object.

    :raises: MalformedFrame
    """
    try:
        return TopicEvent(
            topic=frames[0].decode("utf-8"), event=Event.parse_raw((frames[1]))
        )
    except (ValueError, IndexError, AttributeError) as e:
        raise MalformedFrames() from e
