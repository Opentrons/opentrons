"""Test add labware command."""
from mock import AsyncMock  # type: ignore[attr-defined]
from opentrons.protocols import models
from opentrons.protocol_engine.commands import (
    AddLabwareDefinitionRequest, AddLabwareDefinitionResult
)


def test_add_labware_request(well_plate_def: models.LabwareDefinition) -> None:
    """It should have an AddLabwareDefinitionRequest model."""
    request = AddLabwareDefinitionRequest(
        labware_definition=well_plate_def,
    )

    assert request.labware_definition == well_plate_def


def test_add_labware_result() -> None:
    """It should be have an AddLabwareDefinitionResult model."""
    result = AddLabwareDefinitionResult(
        loadName="loadname",
        namespace="ns",
        version=1,
    )

    assert result.loadName == "loadname"
    assert result.namespace == "ns"
    assert result.version == 1


async def test_add_labware_implementation(
    well_plate_def: models.LabwareDefinition,
    mock_handlers: AsyncMock,
) -> None:
    """An AddLabwareRequest should have an execution implementation."""
    request = AddLabwareDefinitionRequest(
        labware_definition=well_plate_def
    )

    impl = request.get_implementation()
    result = await impl.execute(mock_handlers)

    assert result == AddLabwareDefinitionResult(
        loadName=well_plate_def.parameters.loadName,
        namespace=well_plate_def.namespace,
        version=well_plate_def.version,
    )
