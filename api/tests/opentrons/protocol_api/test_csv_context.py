"""Tests for csv context."""

import pytest
from decoy import Decoy

from opentrons.protocol_api.core.common import CSVCore
from opentrons.protocol_api.csv_context import CSVContext
from opentrons.protocols.api_support.types import APIVersion


@pytest.fixture
def mock_csv_core(decoy: Decoy) -> CSVCore:
    """Get a mock CSVCore."""
    return decoy.mock(cls=CSVCore)


def test_write_row(
    decoy: Decoy,
    mock_csv_core: CSVCore,
) -> None:
    """Pass the row into the core."""
    subject = CSVContext(mock_csv_core, APIVersion(2, 29))
    subject.write_row(["A", "B", "C", "D"])
    decoy.verify(mock_csv_core.write_row(["A", "B", "C", "D"]))
