import pytest
from opentrons.protocol_engine import StateView
from mock import MagicMock

from opentrons.protocols.runner.json_proto.command_translator import (
    CommandTranslator
)


@pytest.fixture
def mock_state_view() -> MagicMock:
    return MagicMock(spec=StateView)


@pytest.fixture
def translator(mock_state_view) -> CommandTranslator:
    return CommandTranslator(state_view=mock_state_view)
