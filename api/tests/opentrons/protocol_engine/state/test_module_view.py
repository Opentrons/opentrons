"""Tests for module state accessors in the protocol engine state store."""
import pytest
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
    THERMOCYCLER_SLOT_TRANSITS_TO_DODGE as DODGE_SLOTS,
)


def get_module_view(
    modules_by_id: Optional[Dict[str, LoadedModule]] = None,
    definition_by_model: Optional[Dict[ModuleModel, ModuleDefinition]] = None,
) -> ModuleView:
    """Get a module view test subject with the specified state."""
    state = ModuleState(
        modules_by_id=modules_by_id or {}, definition_by_model=definition_by_model or {}
    )
    return ModuleView(state=state)


def test_initial_module_data_by_id() -> None:
    """It should raise if module ID doesn't exist."""
    subject = get_module_view()

    with pytest.raises(errors.ModuleDoesNotExistError):
        subject.get("helloWorld")


def test_get_module_data(tempdeck_v1_def: ModuleDefinition) -> None:
    """It should get module data from state by ID."""
    module_data = LoadedModule(
        id="module-id",
        model=ModuleModel.THERMOCYCLER_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        serial="module-serial",
        definition=tempdeck_v1_def,
    )

    subject = get_module_view(modules_by_id={"module-id": module_data})
    assert subject.get("module-id") == module_data


def test_get_all_modules(tempdeck_v1_def: ModuleDefinition) -> None:
    """It should return all modules in state."""
    module1 = LoadedModule(
        id="module-1",
        model=ModuleModel.TEMPERATURE_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        serial="serial-1",
        definition=tempdeck_v1_def,
    )
    module2 = LoadedModule(
        id="module-2",
        model=ModuleModel.MAGNETIC_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2),
        serial="serial-2",
        definition=tempdeck_v1_def,
    )
    subject = get_module_view(modules_by_id={"module-1": module1, "module-2": module2})
    assert subject.get_all() == [module1, module2]


def test_get_definition_by_id(tempdeck_v1_def: ModuleDefinition) -> None:
    """It should return a loaded module's definition by ID."""
    module_data = LoadedModule(
        id="module-id",
        model=ModuleModel.TEMPERATURE_MODULE_V2,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        serial="module-serial",
        definition=tempdeck_v1_def,
    )
    subject = get_module_view(modules_by_id={"module-id": module_data})
    assert subject.get_definition_by_id("module-id") == tempdeck_v1_def


def test_get_definition_by_model(tempdeck_v1_def: ModuleDefinition) -> None:
    """It should return the cached definition of a specific module model."""
    subject = get_module_view(
        definition_by_model={ModuleModel.TEMPERATURE_MODULE_V1: tempdeck_v1_def}
    )
    assert (
        subject.get_definition_by_model(ModuleModel.TEMPERATURE_MODULE_V1)
        == tempdeck_v1_def
    )


def test_raise_error_if_no_definition(tempdeck_v1_def: ModuleDefinition) -> None:
    """It should raise if definition for given model not found."""
    subject = get_module_view(
        definition_by_model={ModuleModel.TEMPERATURE_MODULE_V1: tempdeck_v1_def}
    )
    with pytest.raises(errors.ModuleDefinitionDoesNotExistError):
        subject.get_definition_by_model(ModuleModel.MAGNETIC_MODULE_V2)


def test_get_module_by_serial(tempdeck_v1_def: ModuleDefinition) -> None:
    """It should get a particular loaded module for a given module serial number."""
    module1 = LoadedModule(
        id="module-1",
        model=ModuleModel.TEMPERATURE_MODULE_V2,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        serial="serial-1",
        definition=tempdeck_v1_def,
    )
    module2 = LoadedModule(
        id="module-2",
        model=ModuleModel.MAGNETIC_MODULE_V2,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2),
        serial="serial-2",
        definition=tempdeck_v1_def,
    )
    subject = get_module_view(modules_by_id={"module-1": module1, "module-2": module2})
    assert subject.get_by_serial("serial-2") == module2


def test_get_location(tempdeck_v1_def: ModuleDefinition) -> None:
    """It should return the deck slot location of the module."""
    module_id = "unique-id"
    module = LoadedModule(
        id=module_id,
        model=ModuleModel.MAGNETIC_MODULE_V2,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2),
        serial="serial-1",
        definition=tempdeck_v1_def,
    )
    subject = get_module_view(modules_by_id={module_id: module})
    assert subject.get_location(module_id=module_id) == DeckSlotLocation(
        slotName=DeckSlotName.SLOT_2
    )


def test_get_model(tempdeck_v1_def: ModuleDefinition) -> None:
    """It should return the model of the loaded module."""
    module_id = "unique-id"
    module = LoadedModule(
        id=module_id,
        model=ModuleModel.MAGNETIC_MODULE_V2,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2),
        serial="serial-1",
        definition=tempdeck_v1_def,
    )
    subject = get_module_view(modules_by_id={module_id: module})
    assert subject.get_model(module_id=module_id) == ModuleModel.MAGNETIC_MODULE_V2


def test_get_serial(tempdeck_v1_def: ModuleDefinition) -> None:
    """It should return the serial number of the loaded module."""
    module_id = "unique-id"
    module = LoadedModule(
        id=module_id,
        model=ModuleModel.MAGNETIC_MODULE_V2,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2),
        serial="serial-1",
        definition=tempdeck_v1_def,
    )
    subject = get_module_view(modules_by_id={module_id: module})
    assert subject.get_serial(module_id=module_id) == "serial-1"


def test_get_dimensions(tempdeck_v1_def: ModuleDefinition) -> None:
    """It should return the dimensions of the specified module."""
    module_id = "unique-id"
    module = LoadedModule(
        id=module_id,
        model=ModuleModel.MAGNETIC_MODULE_V2,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2),
        serial="serial-1",
        definition=tempdeck_v1_def,
    )
    subject = get_module_view(modules_by_id={module_id: module})
    assert subject.get_dimensions(module_id=module_id) == tempdeck_v1_def.dimensions


@pytest.mark.parametrize(
    argnames="from_slot, to_slot, should_dodge",
    argvalues=[
        [DODGE_SLOTS[0].start, DODGE_SLOTS[0].end, True],
        [DODGE_SLOTS[2].start, DODGE_SLOTS[2].end, True],
        [DODGE_SLOTS[5].start, DODGE_SLOTS[5].end, True],
        [DeckSlotName.SLOT_2, DeckSlotName.SLOT_4, False],
    ],
)
def test_thermocycler_dodging(
    tempdeck_v1_def: ModuleDefinition,
    from_slot: DeckSlotName,
    to_slot: DeckSlotName,
    should_dodge: bool,
) -> None:
    """It should specify if thermocycler dodging is needed.

    It should return True if thermocycler exists and movement is between bad pairs of
    slot locations.
    """
    module_data = LoadedModule(
        id="module-id",
        model=ModuleModel.THERMOCYCLER_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        serial="module-serial",
        definition=tempdeck_v1_def,
    )

    subject = get_module_view(modules_by_id={"module-id": module_data})
    assert (
        subject.should_dodge_thermocycler(from_slot=from_slot, to_slot=to_slot)
        is should_dodge
    )
