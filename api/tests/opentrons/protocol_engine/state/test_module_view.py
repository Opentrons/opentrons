"""Tests for module state accessors in the protocol engine state store."""
import pytest
from typing import Optional, Dict

from opentrons.protocol_engine import errors
from opentrons.protocol_engine.types import LoadedModule, DeckSlotLocation, DeckSlotName
from opentrons.protocol_engine.state.modules import (
    ModuleView,
    ModuleState
)


def get_module_view(
        modules_by_id: Optional[Dict[str, LoadedModule]] = None,
) -> ModuleView:
    """Get a module view test subject with the specified state."""
    state = ModuleState(
        modules_by_id=modules_by_id or {}
    )
    return ModuleView(state=state)


def test_initial_module_data_by_id() -> None:
    """It should raise if module ID doesn't exist."""
    subject = get_module_view()

    with pytest.raises(errors.ModuleDoesNotExistError):
        subject.get("helloWorld")


def test_get_module_data() -> None:
    """It should get module data from state by ID."""
    module_data = LoadedModule(
        id="module-id",
        model="model-1",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        serial="module-serial"
    )

    subject = get_module_view(modules_by_id={"module-id": module_data})
    assert subject.get("module-id") == module_data

