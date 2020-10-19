"""Test equipment command execution side effects."""
import pytest
from mock import AsyncMock, MagicMock  # type: ignore[attr-defined]
from opentrons.types import Mount

from opentrons.protocol_engine import errors
from opentrons.protocol_engine.state import PipetteData
from opentrons.protocol_engine.resources import IdGenerator, LabwareData
from opentrons.protocol_engine.execution.equipment import EquipmentHandler
from opentrons.protocol_engine.command_models import (
    LoadLabwareRequest,
    LoadLabwareResult,
    LoadPipetteRequest,
    LoadPipetteResult,
)


@pytest.fixture
def mock_labware_data(minimal_labware_def):
    mock = AsyncMock(spec=LabwareData)
    mock.get_labware_definition.return_value = minimal_labware_def
    mock.get_labware_calibration.return_value = (1, 2, 3)
    return mock


@pytest.fixture
def mock_id_generator():
    mock = MagicMock(spec=IdGenerator)
    mock.generate_id.return_value = "unique-id"
    return mock


@pytest.fixture
def handler(mock_labware_data, mock_id_generator, mock_hardware):
    return EquipmentHandler(
        hardware=mock_hardware,
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

    assert type(res) == LoadLabwareResult
    assert res.labwareId == "unique-id"


async def test_load_labware_gets_labware_def(
    mock_labware_data,
    handler,
    minimal_labware_def
):
    """LoadLabwareRequest should create a resource ID for the labware."""
    req = LoadLabwareRequest(
        location=3,
        loadName="load-name",
        namespace="opentrons-test",
        version=1
    )
    res = await handler.handle_load_labware(req)

    assert type(res) == LoadLabwareResult
    assert res.definition == minimal_labware_def
    mock_labware_data.get_labware_definition.assert_called_with(
        load_name="load-name",
        namespace="opentrons-test",
        version=1
    )


async def test_load_labware_gets_labware_cal_data(
    mock_labware_data,
    handler,
    minimal_labware_def
):
    """LoadLabwareRequest should create a resource ID for the labware."""
    req = LoadLabwareRequest(
        location=3,
        loadName="load-name",
        namespace="opentrons-test",
        version=1
    )
    res = await handler.handle_load_labware(req)

    assert type(res) == LoadLabwareResult
    assert res.calibration == (1, 2, 3)
    mock_labware_data.get_labware_calibration.assert_called_with(
        definition=minimal_labware_def,
        location=3,
    )


async def test_load_pipette_assigns_id(
    mock_state_store,
    mock_id_generator,
    handler
):
    req = LoadPipetteRequest(pipetteName="p300_single", mount=Mount.LEFT)
    res = await handler.handle_load_pipette(req, state=mock_state_store.state)

    assert type(res) == LoadPipetteResult
    assert res.pipetteId == "unique-id"


async def test_load_pipette_checks_checks_existence(
    mock_state_store,
    mock_hardware,
    handler
):
    req = LoadPipetteRequest(pipetteName="p300_single", mount=Mount.LEFT)
    await handler.handle_load_pipette(req, state=mock_state_store.state)

    mock_hardware.cache_instruments.assert_called_with({
        Mount.LEFT: "p300_single",
    })


async def test_load_pipette_checks_checks_existence_with_already_loaded(
    mock_state_store,
    mock_hardware,
    handler
):
    mock_state_store.state.get_pipette_data_by_mount.return_value = \
        PipetteData(mount=Mount.LEFT, pipette_name="p300_multi")
    req = LoadPipetteRequest(pipetteName="p300_single", mount=Mount.RIGHT)

    await handler.handle_load_pipette(req, state=mock_state_store.state)

    mock_state_store.state.get_pipette_data_by_mount.assert_called_with(
        Mount.LEFT
    )
    mock_hardware.cache_instruments.assert_called_with({
        Mount.LEFT: "p300_multi",
        Mount.RIGHT: "p300_single",
    })


async def test_load_pipette_raises_if_pipette_not_attached(
    mock_state_store,
    mock_hardware,
    handler
):
    mock_hardware.cache_instruments.side_effect = RuntimeError(
        'mount LEFT: instrument p300_single was requested, '
        'but no instrument is present'
    )

    req = LoadPipetteRequest(pipetteName="p300_single", mount=Mount.LEFT)

    with pytest.raises(
        errors.FailedToLoadPipetteError,
        match=".+p300_single was requested"
    ):
        await handler.handle_load_pipette(req, state=mock_state_store.state)
