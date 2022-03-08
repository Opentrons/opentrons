"""Tests for /runs routes dealing with labware offsets and definitions."""
import pytest
from datetime import datetime
from decoy import Decoy

from opentrons_shared_data.labware.dev_types import LabwareDefinition as LabwareDefDict

from opentrons.types import DeckSlotName
from opentrons.protocol_engine import EngineStatus, types as pe_types
from opentrons.protocols.models import LabwareDefinition

from robot_server.errors import ApiError
from robot_server.service.json_api import RequestModel, SimpleBody
from robot_server.runs.run_models import Run, LabwareDefinitionSummary
from robot_server.runs.engine_store import EngineStore
from robot_server.runs.router.labware_router import (
    add_labware_offset,
    add_labware_definition,
)


@pytest.fixture()
def run() -> Run:
    """Get a fixture Run response data."""
    return Run(
        id="run-id",
        createdAt=datetime(year=2021, month=1, day=1),
        status=EngineStatus.IDLE,
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
        protocolId=None,
    )


@pytest.fixture()
def labware_definition(minimal_labware_def: LabwareDefDict) -> LabwareDefinition:
    """Create a labware definition fixture."""
    return LabwareDefinition.parse_obj(minimal_labware_def)


async def test_add_labware_offset(
    decoy: Decoy,
    engine_store: EngineStore,
    run: Run,
) -> None:
    """It should add the labware offset to the engine, assuming the run is current."""
    labware_offset_request = pe_types.LabwareOffsetCreate(
        definitionUri="namespace_1/load_name_1/123",
        location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    )

    labware_offset = pe_types.LabwareOffset(
        id="labware-offset-id",
        createdAt=datetime(year=2022, month=2, day=2),
        definitionUri="labware-definition-uri",
        location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=pe_types.LabwareOffsetVector(x=0, y=0, z=0),
    )

    decoy.when(
        engine_store.engine.add_labware_offset(labware_offset_request)
    ).then_return(labware_offset)

    result = await add_labware_offset(
        request_body=RequestModel(data=labware_offset_request),
        engine_store=engine_store,
        run=run,
    )

    assert result.content == SimpleBody(data=labware_offset)
    assert result.status_code == 201


async def test_add_labware_offset_not_current(
    decoy: Decoy,
    engine_store: EngineStore,
    run: Run,
) -> None:
    """It should 409 if the run is not current."""
    not_current_run = run.copy(update={"current": False})

    labware_offset_request = pe_types.LabwareOffsetCreate(
        definitionUri="namespace_1/load_name_1/123",
        location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    )

    with pytest.raises(ApiError) as exc_info:
        await add_labware_offset(
            request_body=RequestModel(data=labware_offset_request),
            engine_store=engine_store,
            run=not_current_run,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunStopped"


async def test_add_labware_definition(
    decoy: Decoy,
    engine_store: EngineStore,
    run: Run,
    labware_definition: LabwareDefinition,
) -> None:
    """It should be able to add a labware definition to the engine."""
    uri = pe_types.LabwareUri("some/definition/uri")

    decoy.when(
        engine_store.engine.add_labware_definition(labware_definition)
    ).then_return(uri)

    result = await add_labware_definition(
        engine_store=engine_store,
        run=run,
        request_body=RequestModel(data=labware_definition),
    )

    assert result.content.data == LabwareDefinitionSummary(definitionUri=uri)
    assert result.status_code == 201


async def test_add_labware_definition_not_current(
    decoy: Decoy,
    engine_store: EngineStore,
    run: Run,
    labware_definition: LabwareDefinition,
) -> None:
    """It should 409 if the run is not current."""
    not_current_run = run.copy(update={"current": False})

    with pytest.raises(ApiError) as exc_info:
        await add_labware_definition(
            engine_store=engine_store,
            run=not_current_run,
            request_body=RequestModel(data=labware_definition),
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunStopped"
