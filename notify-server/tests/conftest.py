"""Pytest conf."""
from datetime import datetime
import pytest

from notify_server.models.event import Event
from notify_server.models.sample_events import SampleTwo


@pytest.fixture
def event() -> Event:
    """Event fixture."""
    return Event(
        createdOn=datetime(2000, 1, 1),
        publisher="pub",
        data=SampleTwo(val1=1, val2="2")
    )
