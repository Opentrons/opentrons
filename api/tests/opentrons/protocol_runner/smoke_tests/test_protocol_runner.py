"""Smoke tests for the ProtocolRunner and ProtocolEngine classes.

These tests construct a ProtocolRunner with a real ProtocolEngine
hooked to a simulating HardwareAPI.

Minimal, but valid and complete, protocol files are then loaded from
disk into the runner, and the protocols are run to completion. From
there, the ProtocolEngine state is inspected to check that
everything was loaded and run as expected.
"""
import pytest

from datetime import datetime
from decoy import matchers
from pathlib import Path

from opentrons_shared_data.pipette.dev_types import PipetteNameType

from opentrons.types import MountType, DeckSlotName
from opentrons.protocol_engine import (
    DeckSlotLocation,
    LoadedLabware,
    LoadedModule,
    LoadedPipette,
    ModuleDefinition,
    ModuleModel,
    commands,
    DeckPoint,
)
from opentrons.protocol_reader import ProtocolReader
from opentrons.protocol_runner import create_simulating_runner


# TODO (tz, 6-17-22): API version 3.x in-development.
# Currently parsing protocol versions less then MAX_SUPPORTED_VERSION
@pytest.mark.xfail(strict=True)
async def test_runner_with_python(
    python_protocol_file: Path,
    tempdeck_v1_def: ModuleDefinition,
) -> None:
    """It should run a Python protocol on the ProtocolRunner."""
    protocol_reader = ProtocolReader()
    protocol_source = await protocol_reader.read_saved(
        files=[python_protocol_file],
        directory=None,
    )

    subject = await create_simulating_runner(robot_type="OT-2 Standard")
    result = await subject.run(protocol_source)
    commands_result = result.commands
    pipettes_result = result.state_summary.pipettes
    labware_result = result.state_summary.labware
    modules_result = result.state_summary.modules

    pipette_id_captor = matchers.Captor()
    labware_id_captor = matchers.Captor()

    expected_pipette = LoadedPipette.construct(
        id=pipette_id_captor,
        pipetteName=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    expected_labware = LoadedLabware.construct(
        id=labware_id_captor,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        loadName="opentrons_96_tiprack_300ul",
        definitionUri="opentrons/opentrons_96_tiprack_300ul/1",
        # fixme(mm, 2021-11-11): We should smoke-test that the engine picks up labware
        # offsets, but it's unclear to me what the best way of doing that is, since
        # we don't have access to the engine here to add offsets to it.
        offsetId=None,
    )

    expected_module = LoadedModule.construct(
        id=matchers.IsA(str),
        model=ModuleModel.TEMPERATURE_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        serialNumber=matchers.IsA(str),
    )

    assert expected_pipette in pipettes_result
    assert expected_labware in labware_result
    assert expected_module in modules_result

    expected_command = commands.PickUpTip.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.PickUpTipParams(
            pipetteId=pipette_id_captor.value,
            labwareId=labware_id_captor.value,
            wellName="A1",
        ),
        result=commands.PickUpTipResult(
            tipVolume=300.0, position=DeckPoint(x=0, y=0, z=0)
        ),
    )

    assert expected_command in commands_result


async def test_runner_with_json(json_protocol_file: Path) -> None:
    """It should run a JSON protocol on the ProtocolRunner."""
    protocol_reader = ProtocolReader()
    protocol_source = await protocol_reader.read_saved(
        files=[json_protocol_file],
        directory=None,
    )

    subject = await create_simulating_runner(robot_type="OT-2 Standard")
    result = await subject.run(protocol_source)

    commands_result = result.commands
    pipettes_result = result.state_summary.pipettes
    labware_result = result.state_summary.labware

    expected_pipette = LoadedPipette(
        id="pipette-id",
        pipetteName=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    expected_labware = LoadedLabware(
        id="labware-id",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        loadName="opentrons_96_tiprack_300ul",
        definitionUri="opentrons/opentrons_96_tiprack_300ul/1",
        displayName="Opentrons 96 Tip Rack 300 µL",
        # fixme(mm, 2021-11-11): We should smoke-test that the engine picks up labware
        # offsets, but it's unclear to me what the best way of doing that is, since
        # we don't have access to the engine here to add offsets to it.
        offsetId=None,
    )

    assert expected_pipette in pipettes_result
    assert expected_labware in labware_result

    expected_command = commands.PickUpTip.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.PickUpTipParams(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="A1",
        ),
        result=commands.PickUpTipResult(
            tipVolume=300.0,
            tipLength=51.83,
            tipDiameter=5.23,
            position=DeckPoint(x=14.38, y=74.24, z=64.69),
        ),
    )

    assert expected_command in commands_result


async def test_runner_with_legacy_python(legacy_python_protocol_file: Path) -> None:
    """It should run a Python protocol on the ProtocolRunner."""
    protocol_reader = ProtocolReader()
    protocol_source = await protocol_reader.read_saved(
        files=[legacy_python_protocol_file],
        directory=None,
    )

    subject = await create_simulating_runner(robot_type="OT-2 Standard")
    result = await subject.run(protocol_source)

    commands_result = result.commands
    pipettes_result = result.state_summary.pipettes
    labware_result = result.state_summary.labware

    pipette_id_captor = matchers.Captor()
    labware_id_captor = matchers.Captor()

    expected_pipette = LoadedPipette.construct(
        id=pipette_id_captor,
        pipetteName=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    expected_labware = LoadedLabware.construct(
        id=labware_id_captor,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        loadName="opentrons_96_tiprack_300ul",
        definitionUri="opentrons/opentrons_96_tiprack_300ul/1",
        # fixme(mm, 2021-11-11): When legacy running supports labware offsets, check
        # for that here.
        offsetId=None,
    )

    assert expected_pipette in pipettes_result
    assert expected_labware in labware_result

    expected_command = commands.PickUpTip.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.PickUpTipParams(
            pipetteId=pipette_id_captor.value,
            labwareId=labware_id_captor.value,
            wellName="A1",
        ),
        result=commands.PickUpTipResult(
            tipVolume=300.0, tipLength=51.83, position=DeckPoint(x=0, y=0, z=0)
        ),
    )

    assert expected_command in commands_result


async def test_runner_with_legacy_json(legacy_json_protocol_file: Path) -> None:
    """It should run a Python protocol on the ProtocolRunner."""
    protocol_reader = ProtocolReader()
    protocol_source = await protocol_reader.read_saved(
        files=[legacy_json_protocol_file],
        directory=None,
    )

    subject = await create_simulating_runner(robot_type="OT-2 Standard")
    result = await subject.run(protocol_source)

    commands_result = result.commands
    pipettes_result = result.state_summary.pipettes
    labware_result = result.state_summary.labware

    pipette_id_captor = matchers.Captor()
    labware_id_captor = matchers.Captor()

    expected_pipette = LoadedPipette.construct(
        id=pipette_id_captor,
        pipetteName=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    expected_labware = LoadedLabware.construct(
        id=labware_id_captor,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        loadName="opentrons_96_tiprack_300ul",
        definitionUri="opentrons/opentrons_96_tiprack_300ul/1",
        displayName="Opentrons 96 Tip Rack 300 µL",
        # fixme(mm, 2021-11-11): When legacy running supports labware offsets, check
        # for that here.
        offsetId=None,
    )

    assert expected_pipette in pipettes_result
    assert expected_labware in labware_result

    expected_command = commands.PickUpTip.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.PickUpTipParams(
            pipetteId=pipette_id_captor.value,
            labwareId=labware_id_captor.value,
            wellName="A1",
        ),
        result=commands.PickUpTipResult(
            tipVolume=300.0, tipLength=51.83, position=DeckPoint(x=0, y=0, z=0)
        ),
    )

    assert expected_command in commands_result
