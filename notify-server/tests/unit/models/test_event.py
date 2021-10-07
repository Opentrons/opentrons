"""Unit tests for Event module."""
from datetime import datetime
from typing import Dict, Any

import pytest

from notify_server.models.event import Event
from notify_server.models.payload_type import UserData


@pytest.mark.parametrize(
    argnames=["data"],
    argvalues=[
        # Empty
        [{}],
        # Unknown type
        [{"type": "UserDataBoo"}],
        # Missing Data
        [{"type": "UserData"}],
        # Wrong Types
        [{"type": "UserData", "data": "Hello"}],
    ],
)
def test_bad_data_attribute(data: Dict[str, Any]) -> None:
    """Test that invalid data attribute will cause a validation error."""
    event = {"createdOn": datetime.now().isoformat(), "publisher": "pub", "data": data}
    with pytest.raises(ValueError):
        Event(**event)


@pytest.mark.parametrize(
    argnames=["data", "expected"],
    argvalues=[
        [
            {"type": "UserData", "data": {"val1": 123, "val2": "egg"}},
            UserData(data={"val1": 123, "val2": "egg"}),
        ],
    ],
)
def test_good_data(data: Dict[str, Any], expected: Event) -> None:
    """Test that the data member is validated correctly."""
    event = {"createdOn": datetime.now().isoformat(), "publisher": "pub", "data": data}
    assert expected == Event(**event).data
