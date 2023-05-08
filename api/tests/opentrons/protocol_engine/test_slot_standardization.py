import pytest

from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.types import DeckSlotName
from opentrons.protocol_engine import (
    slot_standardization as subject,
    CommandIntent,
    DeckSlotLocation,
    LabwareOffsetCreate,
    LabwareOffsetLocation,
    LabwareOffsetVector,
    ModuleModel,
)
from opentrons.protocol_engine.commands import LoadLabware, LoadLabwareCreate


@pytest.mark.parametrize("module_model", [None, ModuleModel.MAGNETIC_MODULE_V1])
@pytest.mark.parametrize(
    ("slot_name", "robot_type", "expected_slot_name"),
    [
        (DeckSlotName.SLOT_5, "OT-2 Standard", DeckSlotName.SLOT_5),
        (DeckSlotName.SLOT_C2, "OT-2 Standard", DeckSlotName.SLOT_5),
        (DeckSlotName.SLOT_5, "OT-3 Standard", DeckSlotName.SLOT_C2),
        (DeckSlotName.SLOT_C2, "OT-3 Standard", DeckSlotName.SLOT_C2),
    ],
)
def test_standardize_labware_offset(
    module_model: ModuleModel,
    slot_name: DeckSlotName,
    robot_type: RobotType,
    expected_slot_name: DeckSlotName,
) -> None:
    original = LabwareOffsetCreate(
        definitionUri="opentrons-test/foo/1",
        location=LabwareOffsetLocation(
            moduleModel=module_model,
            slotName=slot_name,
        ),
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )
    expected = LabwareOffsetCreate(
        definitionUri="opentrons-test/foo/1",
        location=LabwareOffsetLocation(
            moduleModel=module_model,
            slotName=expected_slot_name,
        ),
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )
    assert subject.standardize_labware_offset(original, robot_type) == expected
