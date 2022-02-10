"""Test legacy command mapping in an end-to-end environment.

Legacy ProtocolContext objects are prohibitively difficult to instansiate
and mock in an isolated unit test environment.
"""
import io
import pytest
import textwrap
from datetime import datetime
from decoy import matchers

from opentrons.protocol_engine import commands
from opentrons.protocol_reader import ProtocolReader, InputFile
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

        pipette_left.drop_tip()
        pipette_left.pick_up_tip()
        pipette_left.drop_tip(
            location=tip_rack_1.wells_by_name()["A1"]
        )
    """
).encode()


@pytest.fixture
def pick_up_tip_protocol_file() -> InputFile:
    """Put the pick up tip mapping test protocol on disk."""
    return InputFile(filename="protocol-name.py", file=io.BytesIO(PICK_UP_TIP_PROTOCOL))


async def test_legacy_pick_up_tip(
    protocol_reader: ProtocolReader,
    pick_up_tip_protocol_file: InputFile,
) -> None:
    """It should map legacy pick up tip commands."""
    protocol_source = await protocol_reader.read(
        name="test_protocol",
        files=[pick_up_tip_protocol_file],
    )

    subject = await create_simulating_runner()
    result = await subject.run(protocol_source)
    commands_result = result.commands

    tiprack_1_result_captor = matchers.Captor()
    tiprack_2_result_captor = matchers.Captor()
    pipette_left_result_captor = matchers.Captor()
    pipette_right_result_captor = matchers.Captor()

    assert len(commands_result) == 9

    assert commands_result[0] == commands.LoadLabware(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=tiprack_1_result_captor,
    )

    assert commands_result[1] == commands.LoadLabware(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=tiprack_2_result_captor,
    )

    assert commands_result[2] == commands.LoadPipette(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=pipette_left_result_captor,
    )

    assert commands_result[3] == commands.LoadPipette(
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
    pipette_left_id = pipette_left_result_captor.value["pipetteId"]
    pipette_right_id = pipette_right_result_captor.value["pipetteId"]

    assert commands_result[4] == commands.PickUpTip(
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

    assert commands_result[5] == commands.PickUpTip(
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

    assert commands_result[6] == commands.DropTip(
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

    assert commands_result[7] == commands.PickUpTip(
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

    assert commands_result[8] == commands.DropTip(
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
