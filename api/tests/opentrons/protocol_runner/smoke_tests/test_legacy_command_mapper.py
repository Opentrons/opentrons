"""Test legacy command mapping in an end-to-end environment.

Legacy ProtocolContext objects are prohibitively difficult to instansiate
and mock in an isolated unit test environment.
"""
import pytest
import textwrap
from datetime import datetime
from decoy import matchers
from pathlib import Path

from opentrons.protocol_engine import commands
from opentrons.protocol_reader import ProtocolReader
from opentrons.protocol_runner import create_simulating_runner


PICK_UP_TIP_PROTOCOL = textwrap.dedent(
    """
    # my protocol
    metadata = {
        "apiLevel": "2.11",
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
        well_plate_1 = ctx.load_labware(
            load_name="opentrons_96_aluminumblock_nest_wellplate_100ul",
            location="3",
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
            location=tip_rack_2.wells_by_name()["A2"].top(),
        )
        pipette_right.aspirate(
            volume=40,
            rate=130,
            location=well_plate_1["A1"],
        )
        pipette_right.blow_out(
            location=well_plate_1["A1"],
        )
        pipette_right.dispense(
            volume=35,
            location=well_plate_1["B1"],
        )
        pipette_left.drop_tip()
        pipette_left.pick_up_tip()
        pipette_left.drop_tip(
            location=tip_rack_1.wells_by_name()["A1"]
        )
    """
)


@pytest.fixture
def pick_up_tip_protocol_file(tmp_path: Path) -> Path:
    """Put the pick up tip mapping test protocol on disk."""
    path = tmp_path / "protocol-name.py"
    path.write_text(PICK_UP_TIP_PROTOCOL)
    return path


async def test_legacy_pick_up_tip(pick_up_tip_protocol_file: Path) -> None:
    """It should map legacy pick up tip commands."""
    protocol_reader = ProtocolReader()
    protocol_source = await protocol_reader.read_saved(
        files=[pick_up_tip_protocol_file],
        directory=None,
    )

    subject = await create_simulating_runner()
    result = await subject.run(protocol_source)
    commands_result = result.commands
    for command in commands_result:
        print(command.key)

    tiprack_1_result_captor = matchers.Captor()
    tiprack_2_result_captor = matchers.Captor()
    well_plate_1_result_captor = matchers.Captor()
    pipette_left_result_captor = matchers.Captor()
    pipette_right_result_captor = matchers.Captor()

    assert len(commands_result) == 13

    assert commands_result[0] == commands.LoadLabware.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=tiprack_1_result_captor,
    )

    assert commands_result[1] == commands.LoadLabware.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=tiprack_2_result_captor,
    )

    assert commands_result[2] == commands.LoadLabware.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=well_plate_1_result_captor,
    )

    assert commands_result[3] == commands.LoadPipette.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=pipette_left_result_captor,
    )

    assert commands_result[4] == commands.LoadPipette.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=pipette_right_result_captor,
    )

    # TODO(mc, 2021-11-11): not sure why I have to dict-access these properties
    # might be a bug in Decoy, might be something weird that Pydantic does
    tiprack_1_id = tiprack_1_result_captor.value["labwareId"]
    tiprack_2_id = tiprack_2_result_captor.value["labwareId"]
    well_plate_1_id = well_plate_1_result_captor.value["labwareId"]
    pipette_left_id = pipette_left_result_captor.value["pipetteId"]
    pipette_right_id = pipette_right_result_captor.value["pipetteId"]

    assert commands_result[5] == commands.PickUpTip.construct(
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

    assert commands_result[6] == commands.Aspirate.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.AspirateParams(
            pipetteId=pipette_right_id,
            labwareId=well_plate_1_id,
            wellName="A1",
            volume=40,
            flowRate=130
        ),
        result=commands.AspirateResult(),
    )
    assert commands_result[7] == commands.BlowOut.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.BlowOutParams(
            pipetteId=pipette_right_id,
            labwareId=well_plate_1_id,
        ),
        result=commands.BlowOutResult(),
    )
    assert commands_result[8] == commands.Dispense.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.DispenseParams(
            pipetteId=pipette_right_id,
            labwareId=well_plate_1_id,
            wellName="B1",
            volume=35,
        ),
        result=commands.DispenseResult(),
    )
    assert commands_result[9] == commands.PickUpTip.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.PickUpTipParams(
            pipetteId=pipette_right_id,
            labwareId=tiprack_2_id,
            wellName="A2",
        ),
        result=commands.PickUpTipResult(),
    )

    assert commands_result[10] == commands.DropTip.construct(
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

    assert commands_result[11] == commands.PickUpTip.construct(
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

    assert commands_result[12] == commands.DropTip.construct(
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
