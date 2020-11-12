"""ProtocolEngine shared test fixtures."""
import pytest
from datetime import datetime
from mock import AsyncMock, MagicMock  # type: ignore[attr-defined]

from opentrons_shared_data.deck import load as load_deck
from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons_shared_data.labware import load_definition
from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.protocols.api_support.constants import STANDARD_DECK
from opentrons.util.helpers import utc_now
from opentrons.hardware_control.api import API as HardwareController

from opentrons.protocol_engine import (
    ProtocolEngine,
    StateStore,
    StateView,
    CommandExecutor
)


@pytest.fixture
def now() -> datetime:
    """Get the current UTC time."""
    return utc_now()


@pytest.fixture
def mock_state_store() -> MagicMock:
    """Get a mock in the shape of a StateStore."""
    return MagicMock(spec=StateStore)


@pytest.fixture
def mock_state_view() -> MagicMock:
    """Get a mock in the shape of a StateView."""
    return MagicMock(spec=StateView)


@pytest.fixture
def mock_hardware() -> AsyncMock:
    """Get an asynchronous mock in the shape of a HardwareController."""
    return AsyncMock(spec=HardwareController)


@pytest.fixture
def mock_executor() -> AsyncMock:
    """Get an asynchronous mock in the shape of a CommandExecutor."""
    return AsyncMock(spec=CommandExecutor)


@pytest.fixture(scope="session")
def standard_deck_def() -> DeckDefinitionV2:
    """Get the OT-2 standard deck definition."""
    return load_deck(STANDARD_DECK, 2)


@pytest.fixture(scope="session")
def well_plate_def() -> LabwareDefinition:
    """Get the definition of a 96 well plate."""
    return load_definition("corning_96_wellplate_360ul_flat", 1)


@pytest.fixture(scope="session")
def reservoir_def() -> LabwareDefinition:
    """Get the definition of single-row reservoir."""
    return load_definition("nest_12_reservoir_15ml", 1)


@pytest.fixture(scope="session")
def tip_rack_def() -> LabwareDefinition:
    """Get the definition of Opentrons 300 uL tip rack."""
    return load_definition("opentrons_96_tiprack_300ul", 1)


@pytest.fixture
def store(standard_deck_def: DeckDefinitionV2) -> StateStore:
    """Get an actual StateStore."""
    return StateStore(deck_definition=standard_deck_def)


@pytest.fixture
def engine(
    mock_state_store: MagicMock,
    mock_executor: AsyncMock
) -> ProtocolEngine:
    """Get a ProtocolEngine with its dependencies mocked out."""
    return ProtocolEngine(
        state_store=mock_state_store,
        executor=mock_executor,
    )
