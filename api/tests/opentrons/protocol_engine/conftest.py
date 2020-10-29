import pytest
from mock import AsyncMock, MagicMock  # type: ignore[attr-defined]

from opentrons_shared_data.deck import load as load_deck
from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons_shared_data.labware import load_definition
from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.protocols.api_support.constants import STANDARD_DECK
from opentrons.types import MountType
from opentrons.util.helpers import utc_now
from opentrons.hardware_control.api import API as HardwareController

from opentrons.protocol_engine import (
    ProtocolEngine,
    StateStore,
    State,
    CommandExecutor,
    command_models
)
from opentrons.protocol_engine.execution.equipment import EquipmentHandler


@pytest.fixture
def now():
    return utc_now()


@pytest.fixture
def mock_state_store(store):
    return MagicMock(wraps=store)


@pytest.fixture
def mock_state():
    return MagicMock(spec=State)


@pytest.fixture
def mock_hardware():
    return AsyncMock(spec=HardwareController)


@pytest.fixture
def mock_equipment_handler():
    return AsyncMock(spec=EquipmentHandler)


@pytest.fixture
def mock_executor():
    return AsyncMock(spec=CommandExecutor)


@pytest.fixture(scope="session")
def standard_deck_def() -> DeckDefinitionV2:
    return load_deck(STANDARD_DECK, 2)


@pytest.fixture(scope="session")
def well_plate_def() -> LabwareDefinition:
    return load_definition("corning_96_wellplate_360ul_flat", 1)


@pytest.fixture
def store(standard_deck_def):
    return StateStore(deck_definition=standard_deck_def)


@pytest.fixture
def executor(mock_equipment_handler):
    return CommandExecutor(equipment_handler=mock_equipment_handler)


@pytest.fixture
def engine(mock_state_store, mock_executor):
    return ProtocolEngine(
        state_store=mock_state_store,
        executor=mock_executor,
    )


@ pytest.fixture
def load_labware_request(minimal_labware_def):
    return command_models.LoadLabwareRequest(
        loadName=minimal_labware_def["parameters"]["loadName"],
        namespace="opentrons-test",
        version=1,
        location=1,
    )


@ pytest.fixture
def load_labware_result(minimal_labware_def):
    return command_models.LoadLabwareResult(
        labwareId="abc",
        definition=minimal_labware_def,
        calibration=(1, 2, 3),
    )


@ pytest.fixture
def pending_load_labware_command(now, load_labware_request):
    return command_models.PendingCommand(
        created_at=now,
        request=load_labware_request,
    )


@ pytest.fixture
def running_load_labware_command(now, load_labware_request):
    return command_models.RunningCommand(
        created_at=now,
        started_at=now,
        request=load_labware_request,
    )


@ pytest.fixture
def completed_load_labware_command(
    now,
    load_labware_request,
    load_labware_result,


):
    return command_models.CompletedCommand(
        created_at=now,
        started_at=now,
        completed_at=now,
        request=load_labware_request,
        result=load_labware_result,
    )


@pytest.fixture
def load_pipette_request():
    return command_models.LoadPipetteRequest(
        pipetteName="p300_single",
        mount=MountType.LEFT,
    )


@pytest.fixture
def load_pipette_result():
    return command_models.LoadPipetteResult(pipetteId="123")


@pytest.fixture
def pending_load_pipette_command(now, load_pipette_request):
    return command_models.PendingCommand(
        created_at=now,
        request=load_pipette_request,
    )


@pytest.fixture
def running_load_pipette_command(now, load_pipette_request):
    return command_models.RunningCommand(
        created_at=now,
        started_at=now,
        request=load_pipette_request,
    )


@pytest.fixture
def completed_load_pipette_command(
    now,
    load_pipette_request,
    load_pipette_result,
):
    return command_models.CompletedCommand(
        created_at=now,
        started_at=now,
        completed_at=now,
        request=load_pipette_request,
        result=load_pipette_result,
    )
