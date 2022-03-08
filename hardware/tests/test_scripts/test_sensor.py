"""Integration tests for the sensor script."""
from mock import MagicMock

import pytest

@pytest.fixture
def mock_get_input() -> MagicMock:
    """Mock get input."""
    return MagicMock(spec=input)


@pytest.fixture
def mock_output() -> MagicMock:
    """Mock get input."""
    return MagicMock(spec=print)
