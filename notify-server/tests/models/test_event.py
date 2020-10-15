"""Unit tests for Event module."""
from datetime import datetime
from typing import Dict, Any

import pytest

from notify_server.models.event import Event
from notify_server.models.sample_events import (
    SampleOne, SampleOneData, SampleTwo
)


@pytest.mark.parametrize(argnames=["data"],
                         argvalues=[
                             # Empty
                             [{}],
                             # Unknown type
                             [{"type": "SampleThree"}],
                             # Missing Data
                             [{"type": "SampleOne"}],
                             # Wrong Types
                             [{"type": "SampleOne",
                               "data": {"val1": "egg", "val2": 123}}],
                             # Missing Attributes
                             [{"type": "SampleTwo"}],
                             # Wrong types
                             [{"type": "SampleTwo",
                               "val1": "egg", "val2": 123}],
                             # Use SampleTwo schema on sample one type
                             [{"type": "SampleOne", "val1": 123,
                               "val2": "egg"}],
                             # Use SampleOne schema on sample two type
                             [{"type": "SampleTwo",
                               "data": {"val1": 123, "val2": "egg"}}],
                         ])
def test_bad_data_attribute(data: Dict[str, Any]) -> None:
    """Test that invalid data attribute will cause a validation error."""
    event = {
        'createdOn': datetime.now().isoformat(),
        'publisher': 'pub',
        'data': data
    }
    with pytest.raises(ValueError):
        Event(**event)


@pytest.mark.parametrize(
    argnames=["data", "expected"],
    argvalues=[
        [{"type": "SampleOne", "data": {"val1": 123, "val2": "egg"}},
         SampleOne(data=SampleOneData(val1=123, val2="egg"))
         ],
        [{"type": "SampleTwo", "val1": 123, "val2": "egg"},
         SampleTwo(val1=123, val2="egg")
         ],
    ])
def test_good_data(data: Dict[str, Any], expected: Event) -> None:
    """Test that the data member is validated correctly."""
    event = {
        'createdOn': datetime.now().isoformat(),
        'publisher': 'pub',
        'data': data
    }
    assert expected == Event(**event).data
