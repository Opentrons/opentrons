"""Test legacy command mapping in an end-to-end environment.

Legacy ProtocolContext objects are prohibitively difficult to instansiate
and mock in an isolated unit test environment.
"""
import pytest
import textwrap
from datetime import datetime
from decoy import matchers
from pathlib import Path

from opentrons.protocol_engine import (
    commands,
    DeckSlotLocation,
    ModuleModel,
    ModuleLocation,
)
from opentrons.protocol_reader import ProtocolReader
from opentrons.protocol_runner import create_simulating_runner
from opentrons.protocol_runner.legacy_command_mapper import LegacyCommandParams
from opentrons.types import MountType, DeckSlotName
from opentrons_shared_data.pipette.dev_types import PipetteNameType

LEGACY_COMMANDS_PROTOCOL = textwrap.dedent(
    """
    # my protocol

    from opentrons.types import Location, Point

    metadata = {
        "apiLevel": "2.1",
    }

    def run(ctx):
        tip_rack_1 = ctx.load_labware(
            load_name="opentrons_96_tiprack_300ul",
            location="1",
        )
        tip_rack_2 = ctx.load_labware(
            load_name="opentrons_96_tiprack_300ul",
            location="2",
        )
        module_1 = ctx.load_module("tempdeck", "4")
        well_plate_1 = ctx.load_labware(
            load_name="opentrons_96_aluminumblock_nest_wellplate_100ul",
            location="3",
        )
        module_plate_1 = module_1.load_labware(
            "opentrons_96_aluminumblock_nest_wellplate_100ul"
        )
        pipette_left = ctx.load_instrument(
            instrument_name="p300_single",
            mount="left",
            tip_racks=[tip_rack_1],
        )
        pipette_right = ctx.load_instrument(
            instrument_name="p300_multi",
            mount="right",
        )
        pipette_left.pick_up_tip(
            location=tip_rack_1.wells_by_name()["A1"],
        )
        pipette_right.pick_up_tip(
            location=tip_rack_2.wells_by_name()["A1"].top(),
        )
        pipette_left.drop_tip()
        pipette_left.pick_up_tip()
        pipette_left.aspirate(
            volume=40,
            rate=1.0,
            location=module_plate_1["A1"],
        )
        pipette_left.dispense(
            volume=35,
            rate=1.2,
            location=well_plate_1["B1"],
        )
        pipette_left.aspirate(
            volume=40,
            location=well_plate_1.wells_by_name()["A1"],
        )
        pipette_left.dispense(
            volume=35,
            location=module_plate_1.wells_by_name()["B1"],
        )
        pipette_left.blow_out(
            location=well_plate_1.wells_by_name()["B1"].top(),
        )
        pipette_left.aspirate(50)
        pipette_left.dispense(50)
        pipette_left.blow_out(
            location=module_plate_1["B1"].top(),
        )
        pipette_left.aspirate()
        pipette_left.dispense()
        pipette_left.blow_out()
        pipette_left.move_to(Location(point=Point(100, 100, 10),labware=None))
        pipette_left.aspirate()
        pipette_left.dispense()
        pipette_left.blow_out()
        pipette_left.aspirate(50, well_plate_1["D1"].bottom().move(point=Point(100, 10, 0)))
        pipette_left.dispense(50, well_plate_1["F1"].top().move(point=Point(10, 10, 0)))
        pipette_left.aspirate(50, Location(point=Point(100, 100, 10), labware=well_plate_1))
        pipette_left.dispense(50, Location(point=Point(100, 100, 10), labware=well_plate_1))
        pipette_left.drop_tip(
            location=tip_rack_1.wells_by_name()["A1"]
        )
    """
)


@pytest.fixture
def legacy_commands_protocol_file(tmp_path: Path) -> Path:
    """Put the pick up tip mapping test protocol on disk."""
    path = tmp_path / "protocol-name.py"
    path.write_text(LEGACY_COMMANDS_PROTOCOL)
    return path


async def test_legacy_commands(legacy_commands_protocol_file: Path) -> None:
    """It should map legacy pick up tip commands."""
    protocol_reader = ProtocolReader()
    protocol_source = await protocol_reader.read_saved(
        files=[legacy_commands_protocol_file],
        directory=None,
    )

    subject = await create_simulating_runner()
    result = await subject.run(protocol_source)
    commands_result = result.commands

    tiprack_1_result_captor = matchers.Captor()
    tiprack_2_result_captor = matchers.Captor()
    module_1_result_captor = matchers.Captor()
    well_plate_1_result_captor = matchers.Captor()
    module_plate_1_result_captor = matchers.Captor()
    pipette_left_result_captor = matchers.Captor()
    pipette_right_result_captor = matchers.Captor()

    assert len(commands_result) == 31

    assert commands_result[0] == commands.LoadLabware.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.LoadLabwareParams(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            loadName="opentrons_96_tiprack_300ul",
            namespace="opentrons",
            version=1,
        ),
        result=tiprack_1_result_captor,
    )
    assert commands_result[1] == commands.LoadLabware.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.LoadLabwareParams(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2),
            loadName="opentrons_96_tiprack_300ul",
            namespace="opentrons",
            version=1,
        ),
        result=tiprack_2_result_captor,
    )
    assert commands_result[2] == commands.LoadModule.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.LoadModuleParams(
            model=ModuleModel.TEMPERATURE_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
            moduleId="module-0",
        ),
        result=module_1_result_captor,
    )
    assert commands_result[3] == commands.LoadLabware.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.LoadLabwareParams(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            loadName="opentrons_96_aluminumblock_nest_wellplate_100ul",
            namespace="opentrons",
            version=1,
        ),
        result=well_plate_1_result_captor,
    )
    assert commands_result[4] == commands.LoadLabware.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.LoadLabwareParams(
            location=ModuleLocation(moduleId="module-0"),
            loadName="opentrons_96_aluminumblock_nest_wellplate_100ul",
            namespace="opentrons",
            version=1,
        ),
        result=module_plate_1_result_captor,
    )

    assert commands_result[5] == commands.LoadPipette.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.LoadPipetteParams(
            pipetteName=PipetteNameType.P300_SINGLE, mount=MountType.LEFT
        ),
        result=pipette_left_result_captor,
    )

    assert commands_result[6] == commands.LoadPipette.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.LoadPipetteParams(
            pipetteName=PipetteNameType.P300_MULTI, mount=MountType.RIGHT
        ),
        result=pipette_right_result_captor,
    )

    # TODO(mc, 2021-11-11): not sure why I have to dict-access these properties
    # might be a bug in Decoy, might be something weird that Pydantic does
    tiprack_1_id = tiprack_1_result_captor.value["labwareId"]
    tiprack_2_id = tiprack_2_result_captor.value["labwareId"]
    well_plate_1_id = well_plate_1_result_captor.value["labwareId"]
    module_plate_1_id = module_plate_1_result_captor.value["labwareId"]
    pipette_left_id = pipette_left_result_captor.value["pipetteId"]
    pipette_right_id = pipette_right_result_captor.value["pipetteId"]

    assert commands_result[7] == commands.PickUpTip.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.PickUpTipParams(
            pipetteId=pipette_left_id,
            labwareId=tiprack_1_id,
            wellName="A1",
        ),
        result=commands.PickUpTipResult(),
    )
    assert commands_result[8] == commands.PickUpTip.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.PickUpTipParams(
            pipetteId=pipette_right_id,
            labwareId=tiprack_2_id,
            wellName="A1",
        ),
        result=commands.PickUpTipResult(),
    )

    assert commands_result[9] == commands.DropTip.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.DropTipParams(
            pipetteId=pipette_left_id,
            labwareId="fixedTrash",
            wellName="A1",
        ),
        result=commands.DropTipResult(),
    )

    assert commands_result[10] == commands.PickUpTip.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.PickUpTipParams(
            pipetteId=pipette_left_id,
            labwareId=tiprack_1_id,
            wellName="B1",
        ),
        result=commands.PickUpTipResult(),
    )
    assert commands_result[11] == commands.Aspirate.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.AspirateParams(
            pipetteId=pipette_left_id,
            labwareId=module_plate_1_id,
            wellName="A1",
            volume=40,
            flowRate=150,
        ),
        result=commands.AspirateResult(volume=40),
    )
    assert commands_result[12] == commands.Dispense.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.DispenseParams(
            pipetteId=pipette_left_id,
            labwareId=well_plate_1_id,
            wellName="B1",
            volume=35,
            flowRate=360,
        ),
        result=commands.DispenseResult(volume=35),
    )
    assert commands_result[13] == commands.Aspirate.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.AspirateParams(
            pipetteId=pipette_left_id,
            labwareId=well_plate_1_id,
            wellName="A1",
            volume=40,
            flowRate=150.0,
        ),
        result=commands.AspirateResult(volume=40),
    )
    assert commands_result[14] == commands.Dispense.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.DispenseParams(
            pipetteId=pipette_left_id,
            labwareId=module_plate_1_id,
            wellName="B1",
            volume=35,
            flowRate=300,
        ),
        result=commands.DispenseResult(volume=35),
    )
    assert commands_result[15] == commands.BlowOut.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.BlowOutParams(
            pipetteId=pipette_left_id,
            labwareId=well_plate_1_id,
            wellName="B1",
            flowRate=1000.0,
        ),
        result=commands.BlowOutResult(),
    )
    assert commands_result[16] == commands.Aspirate.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.AspirateParams(
            pipetteId=pipette_left_id,
            labwareId=well_plate_1_id,
            wellName="B1",
            volume=50,
            flowRate=150,
        ),
        result=commands.AspirateResult(volume=50),
    )
    assert commands_result[17] == commands.Dispense.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.DispenseParams(
            pipetteId=pipette_left_id,
            labwareId=well_plate_1_id,
            wellName="B1",
            volume=50,
            flowRate=300,
        ),
        result=commands.DispenseResult(volume=50),
    )
    assert commands_result[18] == commands.BlowOut.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.BlowOutParams(
            pipetteId=pipette_left_id,
            labwareId=module_plate_1_id,
            wellName="B1",
            flowRate=1000.0,
        ),
        result=commands.BlowOutResult(),
    )
    assert commands_result[19] == commands.Aspirate.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.AspirateParams(
            pipetteId=pipette_left_id,
            labwareId=module_plate_1_id,
            wellName="B1",
            volume=300,
            flowRate=150,
        ),
        result=commands.AspirateResult(volume=300),
    )
    assert commands_result[20] == commands.Dispense.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.DispenseParams(
            pipetteId=pipette_left_id,
            labwareId=module_plate_1_id,
            wellName="B1",
            volume=300,
            flowRate=300,
        ),
        result=commands.DispenseResult(volume=300),
    )
    assert commands_result[21] == commands.BlowOut.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.BlowOutParams(
            pipetteId=pipette_left_id,
            labwareId=module_plate_1_id,
            wellName="B1",
            flowRate=1000.0,
        ),
        result=commands.BlowOutResult(),
    )
    #   TODO:(jr, 15.08.2022): this should map to move_to when move_to is mapped in a followup ticket RSS-62
    assert commands_result[22] == commands.Custom.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=LegacyCommandParams(
            legacyCommandText="Moving to (100, 100, 10)",
            legacyCommandType="command.MOVE_TO",
        ),
        result=commands.CustomResult(),
    )
    #   TODO:(jr, 15.08.2022): aspirate commands with no labware get filtered
    #   into custom. Refactor this in followup legacy command mapping
    assert commands_result[23] == commands.Custom.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=LegacyCommandParams(
            legacyCommandText="Aspirating 300.0 uL from (100, 100, 10) at 150.0 uL/sec",
            legacyCommandType="command.ASPIRATE",
        ),
        result=commands.CustomResult(),
    )
    #   TODO:(jr, 15.08.2022): dispense commands with no labware get filtered
    #   into custom. Refactor this in followup legacy command mapping
    assert commands_result[24] == commands.Custom.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=LegacyCommandParams(
            legacyCommandText="Dispensing 300.0 uL into (100, 100, 10) at 300.0 uL/sec",
            legacyCommandType="command.DISPENSE",
        ),
        result=commands.CustomResult(),
    )
    #   TODO:(jr, 15.08.2022): blow_out commands with no labware get filtered
    #   into custom. Refactor this in followup legacy command mapping
    assert commands_result[25] == commands.Custom.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=LegacyCommandParams(
            legacyCommandText="Blowing out at (100, 100, 10)",
            legacyCommandType="command.BLOW_OUT",
        ),
        result=commands.CustomResult(),
    )
    assert commands_result[26] == commands.Aspirate.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.AspirateParams(
            pipetteId=pipette_left_id,
            labwareId=well_plate_1_id,
            wellName="D1",
            volume=50,
            flowRate=150,
        ),
        result=commands.AspirateResult(volume=50),
    )
    assert commands_result[27] == commands.Dispense.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.DispenseParams(
            pipetteId=pipette_left_id,
            labwareId=well_plate_1_id,
            wellName="F1",
            volume=50,
            flowRate=300,
        ),
        result=commands.DispenseResult(volume=50),
    )
    #   TODO:(jr, 15.08.2022): aspirate commands with no labware get filtered
    #   into custom. Refactor this in followup legacy command mapping
    assert commands_result[28] == commands.Custom.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=LegacyCommandParams(
            legacyCommandText="Aspirating 50.0 uL from Opentrons 96 Well Aluminum Block with NEST Well Plate 100 µL on 3 at 150.0 uL/sec",
            legacyCommandType="command.ASPIRATE",
        ),
        result=commands.CustomResult(),
    )
    #   TODO:(jr, 15.08.2022): dispense commands with no labware get filtered
    #   into custom. Refactor this in followup legacy command mapping
    assert commands_result[29] == commands.Custom.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=LegacyCommandParams(
            legacyCommandText="Dispensing 50.0 uL into Opentrons 96 Well Aluminum Block with NEST Well Plate 100 µL on 3 at 300.0 uL/sec",
            legacyCommandType="command.DISPENSE",
        ),
        result=commands.CustomResult(),
    )
    assert commands_result[30] == commands.DropTip.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.DropTipParams(
            pipetteId=pipette_left_id,
            labwareId=tiprack_1_id,
            wellName="A1",
        ),
        result=commands.DropTipResult(),
    )
