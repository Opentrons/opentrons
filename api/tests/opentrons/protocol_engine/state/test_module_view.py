"""Tests for module state accessors in the protocol engine state store."""
import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]
from typing import Optional, Dict

from opentrons.types import DeckSlotName
from opentrons.protocol_engine import errors
from opentrons.protocol_engine.types import (
    LoadedModule,
    DeckSlotLocation,
    ModuleDefinition,
    ModuleModel,
)
from opentrons.protocol_engine.state.modules import (
    ModuleView,
    ModuleState,
    HardwareModule,
)


def make_module_view(
    slot_by_module_id: Optional[Dict[str, DeckSlotName]] = None,
    hardware_module_by_slot: Optional[Dict[DeckSlotName, HardwareModule]] = None,
) -> ModuleView:
    """Get a module view test subject with the specified state."""
    state = ModuleState(
        slot_by_module_id=slot_by_module_id or {},
        hardware_module_by_slot=hardware_module_by_slot or {},
    )

    return ModuleView(state=state)


def test_initial_module_data_by_id() -> None:
    """It should raise if module ID doesn't exist."""
    subject = make_module_view()

    with pytest.raises(errors.ModuleDoesNotExistError):
        subject.get("helloWorld")


def test_get_missing_hardware() -> None:
    """It should raise if no loaded hardware."""
    subject = make_module_view(slot_by_module_id={"module-id": DeckSlotName.SLOT_1})

    with pytest.raises(errors.ModuleDoesNotExistError):
        subject.get("module-id")


def test_get_module_data(tempdeck_v1_def: ModuleDefinition) -> None:
    """It should get module data from state by ID."""
    subject = make_module_view(
        slot_by_module_id={"module-id": DeckSlotName.SLOT_1},
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-number",
                definition=tempdeck_v1_def,
            )
        },
    )

    assert subject.get("module-id") == LoadedModule(
        id="module-id",
        model=ModuleModel.TEMPERATURE_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        serialNumber="serial-number",
        definition=tempdeck_v1_def,
    )


def test_get_all_modules(
    tempdeck_v1_def: ModuleDefinition,
    tempdeck_v2_def: ModuleDefinition,
) -> None:
    """It should return all modules in state."""
    subject = make_module_view(
        slot_by_module_id={
            "module-1": DeckSlotName.SLOT_1,
            "module-2": DeckSlotName.SLOT_2,
        },
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-1",
                definition=tempdeck_v1_def,
            ),
            DeckSlotName.SLOT_2: HardwareModule(
                serial_number="serial-2",
                definition=tempdeck_v2_def,
            ),
        },
    )

    assert subject.get_all() == [
        LoadedModule(
            id="module-1",
            serialNumber="serial-1",
            model=ModuleModel.TEMPERATURE_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            definition=tempdeck_v1_def,
        ),
        LoadedModule(
            id="module-2",
            serialNumber="serial-2",
            model=ModuleModel.TEMPERATURE_MODULE_V2,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2),
            definition=tempdeck_v2_def,
        ),
    ]


def test_get_properties_by_id(
    tempdeck_v1_def: ModuleDefinition,
    tempdeck_v2_def: ModuleDefinition,
) -> None:
    """It should return a loaded module's properties by ID."""
    subject = make_module_view(
        slot_by_module_id={
            "module-1": DeckSlotName.SLOT_1,
            "module-2": DeckSlotName.SLOT_2,
        },
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-1",
                definition=tempdeck_v1_def,
            ),
            DeckSlotName.SLOT_2: HardwareModule(
                serial_number="serial-2",
                definition=tempdeck_v2_def,
            ),
        },
    )

    assert subject.get_definition("module-1") == tempdeck_v1_def
    assert subject.get_dimensions("module-1") == tempdeck_v1_def.dimensions
    assert subject.get_model("module-1") == ModuleModel.TEMPERATURE_MODULE_V1
    assert subject.get_serial_number("module-1") == "serial-1"
    assert subject.get_location("module-1") == DeckSlotLocation(
        slotName=DeckSlotName.SLOT_1
    )

    assert subject.get_definition("module-2") == tempdeck_v2_def
    assert subject.get_dimensions("module-2") == tempdeck_v2_def.dimensions
    assert subject.get_model("module-2") == ModuleModel.TEMPERATURE_MODULE_V2
    assert subject.get_serial_number("module-2") == "serial-2"
    assert subject.get_location("module-2") == DeckSlotLocation(
        slotName=DeckSlotName.SLOT_2
    )


def test_get_magnet_true_mm_home_to_base() -> None:
    """It should return the model-specific offset to bottom."""
    subject = make_module_view()
    assert (
        subject.get_magnet_true_mm_home_to_base(
            module_model=ModuleModel.MAGNETIC_MODULE_V1
        )
        == 2.5
    )
    assert (
        subject.get_magnet_true_mm_home_to_base(
            module_model=ModuleModel.MAGNETIC_MODULE_V2
        )
        == 2.5
    )


@pytest.mark.xfail(strict=True)
def test_calculate_magnet_true_mm_above_base_gen1() -> None:
    """It should use half-millimeters as hardware units."""
    subject = make_module_view()

    assert (
        subject.calculate_magnet_true_mm_above_base(
            module_model=ModuleModel.MAGNETIC_MODULE_V1,
            hardware_units_above_base=100,
        )
        == 50
    )

    # TODO: Test hardware_units_above_home, etc. when we better understand
    # the APIv2 behavior that we need to preserve.


def test_calculate_magnet_true_mm_above_base_gen2() -> None:
    """It should use true millimeters as hardware units."""
    subject = make_module_view()

    assert (
        subject.calculate_magnet_true_mm_above_base(
            module_model=ModuleModel.MAGNETIC_MODULE_V2,
            hardware_units_above_base=100,
        )
        == 100
    )

    assert (
        subject.calculate_magnet_true_mm_above_base(
            module_model=ModuleModel.MAGNETIC_MODULE_V2,
            hardware_units_above_home=100,
        )
        == 97.5
    )

    assert (
        subject.calculate_magnet_true_mm_above_base(
            module_model=ModuleModel.MAGNETIC_MODULE_V2,
            labware_default_true_mm_above_base=100,
            hardware_units_above_labware_default=10.0,
        )
        == 110
    )


@pytest.mark.parametrize(
    argnames=["from_slot", "to_slot", "should_dodge"],
    argvalues=[
        (DeckSlotName.SLOT_1, DeckSlotName.FIXED_TRASH, True),
        (DeckSlotName.FIXED_TRASH, DeckSlotName.SLOT_1, True),
        (DeckSlotName.SLOT_4, DeckSlotName.FIXED_TRASH, True),
        (DeckSlotName.FIXED_TRASH, DeckSlotName.SLOT_4, True),
        (DeckSlotName.SLOT_4, DeckSlotName.SLOT_9, True),
        (DeckSlotName.SLOT_9, DeckSlotName.SLOT_4, True),
        (DeckSlotName.SLOT_4, DeckSlotName.SLOT_8, True),
        (DeckSlotName.SLOT_8, DeckSlotName.SLOT_4, True),
        (DeckSlotName.SLOT_1, DeckSlotName.SLOT_8, True),
        (DeckSlotName.SLOT_8, DeckSlotName.SLOT_1, True),
        (DeckSlotName.SLOT_4, DeckSlotName.SLOT_11, True),
        (DeckSlotName.SLOT_11, DeckSlotName.SLOT_4, True),
        (DeckSlotName.SLOT_1, DeckSlotName.SLOT_11, True),
        (DeckSlotName.SLOT_11, DeckSlotName.SLOT_1, True),
        (DeckSlotName.SLOT_2, DeckSlotName.SLOT_4, False),
    ],
)
def test_thermocycler_dodging(
    thermocycler_v1_def: ModuleDefinition,
    from_slot: DeckSlotName,
    to_slot: DeckSlotName,
    should_dodge: bool,
) -> None:
    """It should specify if thermocycler dodging is needed.

    It should return True if thermocycler exists and movement is between bad pairs of
    slot locations.
    """
    subject = make_module_view(
        slot_by_module_id={"module-id": DeckSlotName.SLOT_1},
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-number",
                definition=thermocycler_v1_def,
            )
        },
    )

    assert (
        subject.should_dodge_thermocycler(from_slot=from_slot, to_slot=to_slot)
        is should_dodge
    )


def test_find_attached_module_rejects_missing() -> None:
    """It should raise if the correct module isn't attached."""
    subject = make_module_view()

    with pytest.raises(errors.ModuleNotAttachedError):
        subject.find_attached_module(
            model=ModuleModel.TEMPERATURE_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            attached_modules=[],
        )


@pytest.mark.parametrize(
    argnames=["requested_model", "attached_definition"],
    argvalues=[
        (ModuleModel.TEMPERATURE_MODULE_V1, lazy_fixture("tempdeck_v1_def")),
        (ModuleModel.TEMPERATURE_MODULE_V2, lazy_fixture("tempdeck_v2_def")),
        (ModuleModel.TEMPERATURE_MODULE_V1, lazy_fixture("tempdeck_v2_def")),
        (ModuleModel.TEMPERATURE_MODULE_V2, lazy_fixture("tempdeck_v1_def")),
        (ModuleModel.MAGNETIC_MODULE_V1, lazy_fixture("magdeck_v1_def")),
        (ModuleModel.MAGNETIC_MODULE_V2, lazy_fixture("magdeck_v2_def")),
        (ModuleModel.THERMOCYCLER_MODULE_V1, lazy_fixture("thermocycler_v1_def")),
    ],
)
def test_find_attached_module(
    requested_model: ModuleModel,
    attached_definition: ModuleDefinition,
) -> None:
    """It should return the first attached module that matches."""
    subject = make_module_view()

    attached_modules = [
        HardwareModule(serial_number="serial-1", definition=attached_definition),
        HardwareModule(serial_number="serial-2", definition=attached_definition),
    ]

    result = subject.find_attached_module(
        model=requested_model,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        attached_modules=attached_modules,
    )

    assert result == attached_modules[0]


def test_find_attached_module_skips_non_matching(
    magdeck_v1_def: ModuleDefinition,
    magdeck_v2_def: ModuleDefinition,
) -> None:
    """It should skip over non-matching modules."""
    subject = make_module_view()

    attached_modules = [
        HardwareModule(serial_number="serial-1", definition=magdeck_v1_def),
        HardwareModule(serial_number="serial-2", definition=magdeck_v2_def),
    ]

    result = subject.find_attached_module(
        model=ModuleModel.MAGNETIC_MODULE_V2,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        attached_modules=attached_modules,
    )

    assert result == attached_modules[1]


def test_find_attached_module_skips_already_loaded(
    magdeck_v1_def: ModuleDefinition,
) -> None:
    """It should skip over already assigned modules."""
    subject = make_module_view(
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-1",
                definition=magdeck_v1_def,
            )
        }
    )

    attached_modules = [
        HardwareModule(serial_number="serial-1", definition=magdeck_v1_def),
        HardwareModule(serial_number="serial-2", definition=magdeck_v1_def),
    ]

    result = subject.find_attached_module(
        model=ModuleModel.MAGNETIC_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        attached_modules=attached_modules,
    )

    assert result == attached_modules[1]


def test_find_attached_module_reuses_already_loaded(
    magdeck_v1_def: ModuleDefinition,
) -> None:
    """It should reuse over already assigned modules in the same location."""
    subject = make_module_view(
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-1",
                definition=magdeck_v1_def,
            )
        }
    )

    attached_modules = [
        HardwareModule(serial_number="serial-1", definition=magdeck_v1_def),
        HardwareModule(serial_number="serial-2", definition=magdeck_v1_def),
    ]

    result = subject.find_attached_module(
        model=ModuleModel.MAGNETIC_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        attached_modules=attached_modules,
    )

    assert result == attached_modules[0]


def test_find_attached_module_rejects_location_reassignment(
    magdeck_v1_def: ModuleDefinition,
    tempdeck_v1_def: ModuleDefinition,
) -> None:
    """It should raise if a non-matching module is already present in the slot."""
    subject = make_module_view(
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-1",
                definition=magdeck_v1_def,
            )
        }
    )

    attached_modules = [
        HardwareModule(serial_number="serial-1", definition=magdeck_v1_def),
        HardwareModule(serial_number="serial-2", definition=tempdeck_v1_def),
    ]

    with pytest.raises(errors.ModuleAlreadyPresentError):
        subject.find_attached_module(
            model=ModuleModel.TEMPERATURE_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            attached_modules=attached_modules,
        )
