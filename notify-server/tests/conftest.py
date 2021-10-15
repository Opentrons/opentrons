"""Pytest conf."""
from datetime import datetime
import pytest

from notify_server.models.event import Event
from notify_server.models.payload_type import UserData


@pytest.fixture
def event() -> Event:
    """Event fixture."""
    return Event(
        createdOn=datetime(2000, 1, 1),
        publisher="pub",
        data=UserData(data={"val1": 1, "val2": 2}),
    )
