"""Test equipment command execution side effects."""
import pytest
from mock import MagicMock
from opentrons.types import Mount, Point

from opentrons.protocol_engine.command_execution.resources import (
    IdGenerator,
    LabwareData
)

from opentrons.protocol_engine.command_execution.equipment import (
    EquipmentHandler
)

from opentrons.protocol_engine.command_models import (
    LoadLabwareRequest,
    LoadLabwareResponse,
    LoadPipetteRequest,
    LoadPipetteResponse,
)


@pytest.fixture
def mock_labware_data():
    mock = MagicMock(spec=LabwareData)
    mock.get_labware_definition.return_value = {"mockLabwareDef": True}
    mock.get_labware_calibration.return_value = Point(1, 2, 3)
    return mock


@pytest.fixture
def mock_id_generator():
    mock = MagicMock(spec=IdGenerator)
    mock.generate_id.return_value = "unique-id"
    return mock


@pytest.fixture
def handler(mock_labware_data, mock_id_generator):
    return EquipmentHandler(
        id_generator=mock_id_generator,
        labware_data=mock_labware_data,
    )


async def test_load_labware_assigns_id(mock_id_generator, handler):
    """LoadLabwareRequest should create a resource ID for the labware."""
    req = LoadLabwareRequest(
        location=3,
        loadName="load-name",
        namespace="opentrons-test",
        version=1
    )
    res = await handler.handle_load_labware(req)

    assert type(res) == LoadLabwareResponse
    assert res.labwareId == "unique-id"


async def test_load_labware_gets_labware_def(mock_labware_data, handler):
    """LoadLabwareRequest should create a resource ID for the labware."""
    req = LoadLabwareRequest(
        location=3,
        loadName="load-name",
        namespace="opentrons-test",
        version=1
    )
    res = await handler.handle_load_labware(req)

    assert type(res) == LoadLabwareResponse
    assert res.definition == {"mockLabwareDef": True}
    mock_labware_data.get_labware_definition.assert_called_with(
        load_name="load-name",
        namespace="opentrons-test",
        version=1
    )


async def test_load_labware_gets_labware_cal_data(mock_labware_data, handler):
    """LoadLabwareRequest should create a resource ID for the labware."""
    req = LoadLabwareRequest(
        location=3,
        loadName="load-name",
        namespace="opentrons-test",
        version=1
    )
    res = await handler.handle_load_labware(req)

    assert type(res) == LoadLabwareResponse
    assert res.calibration == Point(1, 2, 3)
    mock_labware_data.get_labware_calibration.assert_called_with(
        definition={"mockLabwareDef": True}
    )


async def test_load_pipette_assigns_id(mock_id_generator, handler):
    req = LoadPipetteRequest(pipetteName="p300_single", mount=Mount.LEFT)
    res = await handler.handle_load_pipette(req)

    assert type(res) == LoadPipetteResponse
    assert res.pipetteId == "unique-id"
