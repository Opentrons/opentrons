from decoy import Decoy
import pytest

from opentrons_shared_data.labware.dev_types import LabwareUri

from opentrons.motion_planning import deck_conflict as wrapped_deck_conflict
from opentrons.protocol_api.core.engine import deck_conflict
from opentrons.protocol_engine import DeckSlotLocation, ModuleModel, StateView
from opentrons.protocol_engine.errors import LabwareNotLoadedOnModuleError
from opentrons.types import DeckSlotName


@pytest.fixture(autouse=True)
def use_mock_wrapped_deck_conflict(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Replace the check() function that our subject should wrap with a mock."""
    mock_check = decoy.mock(func=wrapped_deck_conflict.check)
    monkeypatch.setattr(wrapped_deck_conflict, "check", mock_check)


@pytest.fixture
def mock_state_view(decoy: Decoy) -> StateView:
    """Return a mock in the shape of a StateView."""
    return decoy.mock(cls=StateView)


def test_maps_labware_on_deck(decoy: Decoy, mock_state_view: StateView) -> None:
    decoy.when(
        mock_state_view.labware.get_location(labware_id="labware-id")
    ).then_return(DeckSlotLocation(slotName=DeckSlotName.SLOT_5))

    decoy.when(
        mock_state_view.labware.get_load_name(labware_id="labware-id")
    ).then_return("labware_load_name")
    decoy.when(
        mock_state_view.geometry.get_labware_highest_z(labware_id="labware-id")
    ).then_return(3.14159)
    decoy.when(
        mock_state_view.labware.get_definition_uri(labware_id="labware-id")
    ).then_return(LabwareUri("test/labware_load_name/123"))
    decoy.when(
        mock_state_view.labware.is_fixed_trash(labware_id="labware-id")
    ).then_return(True)

    # Test both ways that the subject's caller can provide a labware:
    # by new_labware_id, and by existing_labware_ids.
    # We reuse the same ID for test convenience; in the real world, they'd be different.
    deck_conflict.check(
        engine_state=mock_state_view,
        existing_labware_ids=["labware-id"],
        existing_module_ids=[],
        new_labware_id="labware-id",
    )
    decoy.verify(
        wrapped_deck_conflict.check(
            existing_items={
                5: wrapped_deck_conflict.Labware(
                    name_for_errors="labware_load_name",
                    highest_z=3.14159,
                    uri=LabwareUri("test/labware_load_name/123"),
                    is_fixed_trash=True,
                )
            },
            new_item=wrapped_deck_conflict.Labware(
                name_for_errors="labware_load_name",
                highest_z=3.14159,
                uri=LabwareUri("test/labware_load_name/123"),
                is_fixed_trash=True,
            ),
            new_location=5,
        )
    )


def test_maps_module_without_labware(decoy: Decoy, mock_state_view: StateView) -> None:
    decoy.when(mock_state_view.labware.get_id_by_module("module-id")).then_raise(
        LabwareNotLoadedOnModuleError()
    )
    decoy.when(mock_state_view.modules.get_overall_height("module-id")).then_return(
        3.14159
    )

    decoy.when(mock_state_view.modules.get_model("module-id")).then_return(
        ModuleModel.HEATER_SHAKER_MODULE_V1
    )
    decoy.when(mock_state_view.modules.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_5)
    )

    # Test both ways that the subject's caller can provide a module:
    # by new_module_id, and by existing_module_ids.
    # We reuse the same ID for test convenience; in the real world, they'd be different.
    deck_conflict.check(
        engine_state=mock_state_view,
        existing_labware_ids=[],
        existing_module_ids=["module-id"],
        new_module_id="module-id",
    )
    decoy.verify(
        wrapped_deck_conflict.check(
            existing_items={
                5: wrapped_deck_conflict.HeaterShakerModule(
                    name_for_errors="heaterShakerModuleV1",
                    highest_z_including_labware=3.14159,
                )
            },
            new_item=wrapped_deck_conflict.HeaterShakerModule(
                name_for_errors="heaterShakerModuleV1",
                highest_z_including_labware=3.14159,
            ),
            new_location=5,
        )
    )


def test_maps_module_with_labware(decoy: Decoy, mock_state_view: StateView) -> None:
    decoy.when(mock_state_view.labware.get_id_by_module("module-id")).then_return("labware-id")
    decoy.when(mock_state_view.geometry.get_labware_highest_z("labware-id")).then_return(
        3.14159
    )

    decoy.when(mock_state_view.modules.get_model("module-id")).then_return(
        ModuleModel.HEATER_SHAKER_MODULE_V1
    )
    decoy.when(mock_state_view.modules.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_5)
    )

    # Test both ways that the subject's caller can provide a module:
    # by new_module_id, and by existing_module_ids.
    # We reuse the same ID for test convenience; in the real world, they'd be different.
    deck_conflict.check(
        engine_state=mock_state_view,
        existing_labware_ids=[],
        existing_module_ids=["module-id"],
        new_module_id="module-id",
    )
    decoy.verify(
        wrapped_deck_conflict.check(
            existing_items={
                5: wrapped_deck_conflict.HeaterShakerModule(
                    name_for_errors="heaterShakerModuleV1",
                    highest_z_including_labware=3.14159,
                )
            },
            new_item=wrapped_deck_conflict.HeaterShakerModule(
                name_for_errors="heaterShakerModuleV1",
                highest_z_including_labware=3.14159,
            ),
            new_location=5,
        )
    )


def test_maps_different_module_types(decoy: Decoy) -> None:
    raise NotImplementedError
