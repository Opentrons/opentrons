"""Test equipment command execution side effects."""
import pytest
from mock import AsyncMock, MagicMock  # type: ignore[attr-defined]
from opentrons.protocol_engine.errors import LabwareDefinitionDoesNotExistError

from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.types import Mount as HwMount, MountType, DeckSlotName

from opentrons.protocol_engine import errors, ResourceProviders, StateView
from opentrons.protocol_engine.types import DeckSlotLocation, PipetteName
from opentrons.protocol_engine.state import PipetteData

from opentrons.protocol_engine.execution.equipment import (
    EquipmentHandler,
    LoadedLabware,
    LoadedPipette,
)


@pytest.fixture
def mock_resources_with_data(
    minimal_labware_def: LabwareDefinition,
    mock_resources: AsyncMock,
) -> AsyncMock:
    """Get a mock in the shape of the LabwareDataProvider primed with data."""
    mock_resources.labware_data.get_labware_definition.return_value = (
        minimal_labware_def
    )
    mock_resources.labware_data.get_labware_calibration.return_value = (1, 2, 3)
    mock_resources.id_generator.generate_id.return_value = "unique-id"

    return mock_resources


@pytest.fixture
def handler(
    mock_hardware: AsyncMock,
    mock_state_view: MagicMock,
    mock_resources_with_data: AsyncMock,
) -> EquipmentHandler:
    """Get an EquipmentHandler with its dependencies mocked out."""
    return EquipmentHandler(
        hardware=mock_hardware,
        state=mock_state_view,
        resources=mock_resources_with_data,
    )


async def test_load_labware_assigns_id(
    mock_resources_with_data: AsyncMock,
    handler: EquipmentHandler,
) -> None:
    """Loading labware should create a resource ID for the labware."""
    res = await handler.load_labware(
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        load_name="load-name",
        namespace="opentrons-test",
        version=1,
    )

    assert type(res) == LoadedLabware
    assert res.labware_id == "unique-id"


async def test_load_labware_gets_labware_def(
    minimal_labware_def: LabwareDefinition,
    mock_resources_with_data: AsyncMock,
    handler: EquipmentHandler,
    mock_state_view: StateView,
) -> None:
    """Loading labware should load the labware's defintion."""
    mock_state_view.labware.get_labware_definition.side_effect = LabwareDefinitionDoesNotExistError

    res = await handler.load_labware(
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        load_name="load-name",
        namespace="opentrons-test",
        version=1,
    )

    assert type(res) == LoadedLabware
    assert res.definition == minimal_labware_def
    mock_resources_with_data.labware_data.get_labware_definition.assert_called_with(
        load_name="load-name", namespace="opentrons-test", version=1
    )


async def test_load_labware_uses_loaded_labware_def(
    minimal_labware_def: LabwareDefinition,
    mock_resources_with_data: AsyncMock,
    handler: EquipmentHandler,
    mock_state_view: StateView,
) -> None:
    """Loading labware should use the labware definition already in state."""
    mock_state_view.labware.get_labware_definition.return_value = minimal_labware_def

    res = await handler.load_labware(
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        load_name="load-name",
        namespace="opentrons-test",
        version=1,
    )

    assert type(res) == LoadedLabware
    assert res.definition == minimal_labware_def
    mock_state_view.labware.get_labware_definition.assert_called_once_with(
        load_name="load-name", namespace="opentrons-test", version=1
    )
    mock_resources_with_data.labware_data.get_labware_definition.assert_not_called()


async def test_load_labware_gets_labware_cal_data(
    minimal_labware_def: LabwareDefinition,
    mock_resources_with_data: AsyncMock,
    handler: EquipmentHandler,
    mock_state_view: StateView,
) -> None:
    """Loading labware should load the labware's calibration data."""
    mock_state_view.labware.get_labware_definition.return_value = minimal_labware_def

    res = await handler.load_labware(
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        load_name="load-name",
        namespace="opentrons-test",
        version=1,
    )

    assert type(res) == LoadedLabware
    assert res.calibration == (1, 2, 3)
    mock_resources_with_data.labware_data.get_labware_calibration.assert_called_with(
        definition=minimal_labware_def,
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
    )


async def test_load_pipette_assigns_id(
    mock_resources_with_data: ResourceProviders,
    handler: EquipmentHandler,
) -> None:
    """Loading a pipette should generate a unique identifier for the pipette."""
    res = await handler.load_pipette(
        pipette_name=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
        pipette_id=None,
    )

    assert type(res) == LoadedPipette
    assert res.pipette_id == "unique-id"


async def test_load_pipette_uses_provided_id(
    mock_resources_with_data: AsyncMock,
    handler: EquipmentHandler,
) -> None:
    """It should use the provided ID rather than generating an ID for the pipette."""
    res = await handler.load_pipette(
        pipette_name=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
        pipette_id="my pipette id"
    )

    assert type(res) == LoadedPipette
    assert res.pipette_id == "my pipette id"
    mock_resources_with_data.id_generator.generate_id.assert_not_called()


async def test_load_pipette_checks_checks_existence(
    mock_state_view: MagicMock,
    mock_hardware: AsyncMock,
    handler: EquipmentHandler,
) -> None:
    """Loading a pipette should cache hardware instruments."""
    mock_state_view.pipettes.get_pipette_data_by_mount.return_value = None
    await handler.load_pipette(
        pipette_name=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
        pipette_id=None,
    )

    mock_state_view.pipettes.get_pipette_data_by_mount.assert_called_with(
        MountType.RIGHT
    )
    mock_hardware.cache_instruments.assert_called_with(
        {
            HwMount.LEFT: "p300_single",
        }
    )


async def test_load_pipette_checks_checks_existence_with_already_loaded(
    mock_state_view: MagicMock,
    mock_hardware: AsyncMock,
    handler: EquipmentHandler,
) -> None:
    """Loading a pipette should cache with pipettes already attached."""
    mock_state_view.pipettes.get_pipette_data_by_mount.return_value = PipetteData(
        mount=MountType.LEFT,
        pipette_name=PipetteName.P300_MULTI,
    )
    await handler.load_pipette(
        pipette_name=PipetteName.P300_SINGLE,
        mount=MountType.RIGHT,
        pipette_id=None,
    )

    mock_state_view.pipettes.get_pipette_data_by_mount.assert_called_with(
        MountType.LEFT
    )
    mock_hardware.cache_instruments.assert_called_with(
        {
            HwMount.LEFT: "p300_multi",
            HwMount.RIGHT: "p300_single",
        }
    )


async def test_load_pipette_raises_if_pipette_not_attached(
    mock_state_view: MagicMock,
    mock_hardware: AsyncMock,
    handler: EquipmentHandler,
) -> None:
    """Loading a pipette should should raise if unable to cache instruments."""
    mock_hardware.cache_instruments.side_effect = RuntimeError(
        "mount LEFT: instrument p300_single was requested, "
        "but no instrument is present"
    )

    with pytest.raises(
        errors.FailedToLoadPipetteError, match=".+p300_single was requested"
    ):
        await handler.load_pipette(
            pipette_name=PipetteName.P300_SINGLE,
            mount=MountType.LEFT,
            pipette_id=None,
        )
