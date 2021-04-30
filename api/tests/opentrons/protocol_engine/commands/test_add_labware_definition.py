"""Test add labware command."""
import pytest
from mock import AsyncMock  # type: ignore[attr-defined]
from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.protocols import models
from opentrons.protocol_engine.commands import (
    AddLabwareDefinitionRequest, AddLabwareDefinitionResult
)


@pytest.fixture
def labware_definition(well_plate_def: LabwareDefinition) -> models.LabwareDefinition:
    """A labware definition model."""
    return models.LabwareDefinition.parse_obj(well_plate_def)


def test_add_labware_request(labware_definition: models.LabwareDefinition) -> None:
    """It should have an AddLabwareDefinitionRequest model."""
    request = AddLabwareDefinitionRequest(
        labware_definition=labware_definition,
    )

    assert request.labware_definition == labware_definition


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
    labware_definition: models.LabwareDefinition,
    mock_handlers: AsyncMock,
) -> None:
    """An AddLabwareRequest should have an execution implementation."""
    request = AddLabwareDefinitionRequest(
        labware_definition=labware_definition
    )

    impl = request.get_implementation()
    result = await impl.execute(mock_handlers)

    assert result == AddLabwareDefinitionResult(
        loadName=labware_definition.parameters.loadName,
        namespace=labware_definition.namespace,
        version=labware_definition.version,
    )
