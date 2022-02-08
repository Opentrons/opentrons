"""Unit tests for LegacyLabwareOffsetProvider."""


from datetime import datetime

import pytest
from decoy import Decoy

from opentrons.types import DeckSlotName, Point
from opentrons.protocol_engine import (
    LabwareOffset,
    LabwareOffsetVector,
    LabwareOffsetLocation,
    ModuleModel,
)
from opentrons.protocol_engine.state import LabwareView
from opentrons.protocol_runner.legacy_labware_offset_provider import (
    LegacyLabwareOffsetProvider,
    LegacyProvidedLabwareOffset,
)
from opentrons.protocol_runner.legacy_wrappers import LegacyTemperatureModuleModel


@pytest.fixture
def labware_view(decoy: Decoy) -> LabwareView:
    """Return a mock LabwareView."""
    return decoy.mock(cls=LabwareView)


@pytest.fixture
def subject(labware_view: LabwareView) -> LegacyLabwareOffsetProvider:
    """Return a LegacyLabwareOffsetProvider depending on the mocked LabwareView."""
    return LegacyLabwareOffsetProvider(labware_view=labware_view)


def test_find_something(
    subject: LegacyLabwareOffsetProvider, labware_view: LabwareView, decoy: Decoy
) -> None:
    """It should pass along simplified labware offset info from Protocol Engine."""
    decoy.when(
        labware_view.find_applicable_labware_offset(
            definition_uri="some_namespace/some_load_name/123",
            location=LabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_1,
                moduleModel=ModuleModel.TEMPERATURE_MODULE_V1,
            ),
        )
    ).then_return(
        LabwareOffset(
            # Subject should pass these along:
            id="labware-offset-id",
            vector=LabwareOffsetVector(x=1, y=2, z=3),
            # Shouldn't matter; subject should throw these away:
            definitionUri="result_definition_uri_should_not_matter",
            location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_11),
            createdAt=datetime(year=2021, month=1, day=1),
        )
    )

    result = subject.find(
        labware_definition_uri="some_namespace/some_load_name/123",
        requested_module_model=LegacyTemperatureModuleModel.TEMPERATURE_V1,
        deck_slot=DeckSlotName.SLOT_1,
    )

    assert result == LegacyProvidedLabwareOffset(
        delta=Point(x=1, y=2, z=3),
        offset_id="labware-offset-id",
    )


def test_find_nothing(
    subject: LegacyLabwareOffsetProvider, labware_view: LabwareView, decoy: Decoy
) -> None:
    """It should return a zero offset when Protocol Engine has no offset to provide."""
    decoy_call_rehearsal = labware_view.find_applicable_labware_offset(
        definition_uri="some_namespace/some_load_name/123",
        location=LabwareOffsetLocation(
            slotName=DeckSlotName.SLOT_1,
            moduleModel=ModuleModel.TEMPERATURE_MODULE_V1,
        ),
    )

    decoy.when(decoy_call_rehearsal).then_return(None)

    result = subject.find(
        labware_definition_uri="some_namespace/some_load_name/123",
        requested_module_model=LegacyTemperatureModuleModel.TEMPERATURE_V1,
        deck_slot=DeckSlotName.SLOT_1,
    )

    assert result == LegacyProvidedLabwareOffset(
        delta=Point(x=0, y=0, z=0), offset_id=None
    )
