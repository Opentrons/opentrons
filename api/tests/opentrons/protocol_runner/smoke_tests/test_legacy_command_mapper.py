"""Test legacy command mapping in an end-to-end environment.

Legacy ProtocolContext objects are prohibitively difficult to instansiate
and mock in an isolated unit test environment.
"""
import pytest
import textwrap
from datetime import datetime
from pathlib import Path
from decoy import matchers

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_engine import commands
from opentrons.protocol_reader import ProtocolSource, PythonProtocolConfig
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
    """
)


@pytest.fixture
def pick_up_tip_protocol_file(tmp_path: Path) -> Path:
    """Put the pick up tip mapping test protocol on disk."""
    file_path = tmp_path / "protocol-name.py"
    file_path.write_text(PICK_UP_TIP_PROTOCOL)
    return file_path


async def test_legacy_pick_up_tip(pick_up_tip_protocol_file: Path) -> None:
    """It should map legacy pick up tip commands."""
    protocol_source = ProtocolSource(
        directory=pick_up_tip_protocol_file.parent,
        main_file=pick_up_tip_protocol_file,
        config=PythonProtocolConfig(api_version=APIVersion(2, 11)),
        files=[],
        metadata={},
    )

    subject = await create_simulating_runner()
    result = await subject.run(protocol_source)
    commands_result = result.commands

    tiprack_1_result_captor = matchers.Captor()
    tiprack_2_result_captor = matchers.Captor()
    pipette_left_result_captor = matchers.Captor()
    pipette_right_result_captor = matchers.Captor()

    assert len(commands_result) == 8

    assert commands_result[0] == commands.LoadLabware.construct(
        id=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=tiprack_1_result_captor,
    )

    assert commands_result[1] == commands.LoadLabware.construct(
        id=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=tiprack_2_result_captor,
    )

    assert commands_result[2] == commands.LoadPipette.construct(
        id=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=matchers.Anything(),
        result=pipette_left_result_captor,
    )

    assert commands_result[3] == commands.LoadPipette.construct(
        id=matchers.IsA(str),
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

    assert commands_result[4] == commands.PickUpTip.construct(
        id=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.PickUpTipParams(
            pipetteId=pipette_left_id,
            labwareId=tiprack_1_id,
            wellName="A1",
        ),
    )

    assert commands_result[5] == commands.PickUpTip.construct(
        id=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.PickUpTipParams(
            pipetteId=pipette_right_id,
            labwareId=tiprack_2_id,
            wellName="A2",
        ),
    )

    # skip checking drop tip command at index 6

    assert commands_result[7] == commands.PickUpTip.construct(
        id=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.PickUpTipParams(
            pipetteId=pipette_left_id,
            labwareId=tiprack_1_id,
            wellName="B1",
        ),
    )
