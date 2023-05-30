"""Unit tests for the deck_conflict module."""

from decoy import Decoy, matchers
import pytest

from opentrons_shared_data.labware.dev_types import LabwareUri
from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.motion_planning import deck_conflict as wrapped_deck_conflict
from opentrons.protocol_api.core.engine import deck_conflict
from opentrons.protocol_engine import Config, DeckSlotLocation, ModuleModel, StateView
from opentrons.protocol_engine.errors import LabwareNotLoadedOnModuleError
from opentrons.types import DeckSlotName

from opentrons.protocol_engine.types import DeckType


@pytest.fixture(autouse=True)
def use_mock_wrapped_deck_conflict(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Replace the check() function that our subject should wrap with a mock."""
    mock_check = decoy.mock(func=wrapped_deck_conflict.check)
    monkeypatch.setattr(wrapped_deck_conflict, "check", mock_check)


@pytest.fixture
def mock_state_view(
    decoy: Decoy,
    robot_type: RobotType,
    deck_type: DeckType,
) -> StateView:
    """Return a mock in the shape of a StateView."""
    mock_state_view = decoy.mock(cls=StateView)
    config = Config(robot_type=robot_type, deck_type=deck_type)
    decoy.when(mock_state_view.config).then_return(config)
    return mock_state_view


@pytest.mark.parametrize(
    ("robot_type", "deck_type"), [("OT-3 Standard", DeckType.OT3_STANDARD)]
)
def test_noop_if_ot3(decoy: Decoy, mock_state_view: StateView) -> None:
    """For now, it shouldn't do anything if it's an OT-3."""
    deck_conflict.check(
        engine_state=mock_state_view,
        existing_labware_ids=["lw1", "lw2"],
        existing_module_ids=["m1", "m2"],
        new_labware_id="lw3",
    )

    deck_conflict.check(
        engine_state=mock_state_view,
        existing_labware_ids=["lw1", "lw2"],
        existing_module_ids=["m1", "m2"],
        new_module_id="m3",
    )

    decoy.verify(
        wrapped_deck_conflict.check(
            existing_items=matchers.Anything(),
            new_item=matchers.Anything(),
            new_location=matchers.Anything(),
        ),
        times=0,
    )


@pytest.mark.parametrize(
    ("robot_type", "deck_type"), [("OT-2 Standard", DeckType.OT2_STANDARD)]
)
def test_maps_labware_on_deck(decoy: Decoy, mock_state_view: StateView) -> None:
    """It should correcly map a labware that's loaded directly into a deck slot."""
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


@pytest.mark.parametrize(
    ("robot_type", "deck_type"), [("OT-2 Standard", DeckType.OT2_STANDARD)]
)
def test_maps_module_without_labware(decoy: Decoy, mock_state_view: StateView) -> None:
    """It should correctly map a module with no labware loaded atop it."""
    decoy.when(mock_state_view.labware.get_id_by_module("module-id")).then_raise(
        LabwareNotLoadedOnModuleError()
    )
    decoy.when(mock_state_view.modules.get_overall_height("module-id")).then_return(
        3.14159
    )

    decoy.when(mock_state_view.modules.get_connected_model("module-id")).then_return(
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


@pytest.mark.parametrize(
    ("robot_type", "deck_type"), [("OT-2 Standard", DeckType.OT2_STANDARD)]
)
def test_maps_module_with_labware(decoy: Decoy, mock_state_view: StateView) -> None:
    """It should correctly map a module with a labware loaded atop it.

    The highest_z should include both the labware and the module.
    """
    decoy.when(mock_state_view.labware.get_id_by_module("module-id")).then_return(
        "labware-id"
    )
    decoy.when(
        mock_state_view.geometry.get_labware_highest_z("labware-id")
    ).then_return(3.14159)

    decoy.when(mock_state_view.modules.get_connected_model("module-id")).then_return(
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


@pytest.mark.parametrize(
    ("robot_type", "deck_type"), [("OT-2 Standard", DeckType.OT2_STANDARD)]
)
@pytest.mark.parametrize("module_model", ModuleModel)
def test_maps_different_module_models(
    decoy: Decoy, mock_state_view: StateView, module_model: ModuleModel
) -> None:
    """It should correctly map all possible kinds of hardware module."""

    def get_expected_mapping_result() -> wrapped_deck_conflict.DeckItem:
        expected_name_for_errors = module_model.value
        if module_model is ModuleModel.HEATER_SHAKER_MODULE_V1:
            return wrapped_deck_conflict.HeaterShakerModule(
                name_for_errors=expected_name_for_errors,
                highest_z_including_labware=3.14159,
            )
        elif (
            module_model is ModuleModel.THERMOCYCLER_MODULE_V1
            or module_model is ModuleModel.THERMOCYCLER_MODULE_V2
        ):
            return wrapped_deck_conflict.ThermocyclerModule(
                name_for_errors=expected_name_for_errors,
                highest_z_including_labware=3.14159,
                is_semi_configuration=False,
            )
        elif (
            module_model is ModuleModel.MAGNETIC_MODULE_V1
            or module_model is ModuleModel.MAGNETIC_MODULE_V2
            or module_model is ModuleModel.TEMPERATURE_MODULE_V1
            or module_model is ModuleModel.TEMPERATURE_MODULE_V2
            or module_model is ModuleModel.MAGNETIC_BLOCK_V1
        ):
            return wrapped_deck_conflict.OtherModule(
                name_for_errors=expected_name_for_errors,
                highest_z_including_labware=3.14159,
            )
        # There is deliberately no catch-all `else` block here.
        # If a new value is added to ModuleModel, it should cause an error here and
        # force us to think about how it should be mapped.

    decoy.when(mock_state_view.modules.get_connected_model("module-id")).then_return(
        module_model
    )

    decoy.when(mock_state_view.labware.get_id_by_module("module-id")).then_raise(
        LabwareNotLoadedOnModuleError()
    )
    decoy.when(mock_state_view.modules.get_overall_height("module-id")).then_return(
        3.14159
    )
    decoy.when(mock_state_view.modules.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_5)
    )

    expected_mapping_result = get_expected_mapping_result()

    deck_conflict.check(
        engine_state=mock_state_view,
        existing_labware_ids=[],
        existing_module_ids=[],
        new_module_id="module-id",
    )
    decoy.verify(
        wrapped_deck_conflict.check(
            existing_items={},
            new_item=expected_mapping_result,
            new_location=5,
        )
    )
