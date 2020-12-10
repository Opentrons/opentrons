"""Implementation of the QueueEntry class."""
from __future__ import annotations

from typing import List

from pydantic import BaseModel

from notify_server.models.event import Event


class MalformedFrames(Exception):
    """Exception raised on badly formed frames."""

    pass


class QueueEntry(BaseModel):
    """An entry in a send/receive queue."""

    topic: str
    event: Event

    def to_frames(self) -> List[bytes]:
        """Create zmq frames from members."""
        return [
            bytes(v, 'utf-8') for v in (self.topic, self.event.json(),)]

    @classmethod
    def from_frames(cls, frames: List[bytes]) -> QueueEntry:
        """
        Create a QueueEntry from a zmq frame.

        The frame must have two entries: a topic, a json serialized Event
        object.

        :raises: MalformedFrame
        """
        try:
            return cls(
                topic=frames[0].decode(),
                event=Event.parse_raw((frames[1]))
            )
        except (ValueError, IndexError, AttributeError) as e:
            raise MalformedFrames() from e
