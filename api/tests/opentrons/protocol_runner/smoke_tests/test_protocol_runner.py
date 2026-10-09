"""Smoke tests for the AbstractRunner and ProtocolEngine classes.

These tests construct a AbstractRunner with a real ProtocolEngine
hooked to a simulating HardwareAPI.

Minimal, but valid and complete, protocol files are then loaded from
disk into the runner, and the protocols are run to completion. From
there, the ProtocolEngine state is inspected to check that
everything was loaded and run as expected.
"""

from datetime import datetime
from pathlib import Path

from math import isclose
from decoy import matchers

from opentrons_shared_data.pipette.types import PipetteNameType

from opentrons.protocol_engine import (
    DeckPoint,
    DeckSlotLocation,
    EngineStatus,
    LoadedLabware,
    LoadedModule,
    LoadedPipette,
    ModuleDefinition,
    ModuleModel,
    commands,
)
from opentrons.protocol_reader import ProtocolReader
from opentrons.protocol_runner.create_simulating_orchestrator import (
    create_simulating_orchestrator,
)
from opentrons.types import DeckSlotName, MountType


async def test_runner_with_python(
    python_protocol_file: Path,
    tempdeck_v2_def: ModuleDefinition,
) -> None:
    """It should run a Python protocol on the PythonAndLegacyRunner."""
    protocol_reader = ProtocolReader()
    protocol_source = await protocol_reader.read_saved(
        files=[python_protocol_file],
        directory=None,
    )

    subject = await create_simulating_orchestrator(
        robot_type="OT-3 Standard", protocol_config=protocol_source.config
    )
    result = await subject.run(
        deck_configuration=[],
        protocol_source=protocol_source,
        run_time_param_values=None,
    )
    commands_result = await subject.get_all_commands()
    pipettes_result = result.state_summary.pipettes
    labware_result = result.state_summary.labware
    modules_result = result.state_summary.modules

    pipette_id_captor = matchers.Captor()
    labware_id_captor = matchers.Captor()

    expected_pipette = LoadedPipette.model_construct(
        id=pipette_id_captor,
        pipetteName=PipetteNameType.P1000_SINGLE_FLEX,
        mount=MountType.LEFT,
    )

    expected_labware = LoadedLabware.model_construct(
        id=labware_id_captor,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
        loadName="opentrons_flex_96_tiprack_1000ul",
        definitionUri="opentrons/opentrons_flex_96_tiprack_1000ul/1",
        # fixme(mm, 2021-11-11): We should smoke-test that the engine picks up labware
        # offsets, but it's unclear to me what the best way of doing that is, since
        # we don't have access to the engine here to add offsets to it.
        offsetId=None,
    )

    expected_module = LoadedModule.model_construct(
        id=matchers.IsA(str),
        model=ModuleModel.TEMPERATURE_MODULE_V2,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_C1),
        serialNumber=matchers.IsA(str),
    )

    assert expected_pipette in pipettes_result
    assert expected_labware in labware_result
    assert expected_module in modules_result

    expected_command = commands.PickUpTip.model_construct(
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
        notes=[],
        result=commands.PickUpTipResult(
            tipVolume=1000.0,
            tipLength=85.94999999999999,
            tipDiameter=5.47,
            position=DeckPoint(x=14.38, y=395.38, z=99.0),
        ),
        commandAnnotationIds=[],
    )

    assert expected_command in commands_result
    await subject.finish()


async def test_runner_with_json(json_protocol_file: Path) -> None:
    """It should run a JSON protocol on the JsonRunner."""
    protocol_reader = ProtocolReader()
    protocol_source = await protocol_reader.read_saved(
        files=[json_protocol_file],
        directory=None,
    )

    subject = await create_simulating_orchestrator(
        robot_type="OT-3 Standard", protocol_config=protocol_source.config
    )
    result = await subject.run(deck_configuration=[], protocol_source=protocol_source)

    commands_result = await subject.get_all_commands()
    pipettes_result = result.state_summary.pipettes
    labware_result = result.state_summary.labware

    expected_pipette = LoadedPipette(
        id="pipette-id",
        pipetteName=PipetteNameType.P1000_SINGLE_FLEX,
        mount=MountType.LEFT,
    )

    expected_labware = LoadedLabware(
        id="labware-id",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
        loadName="opentrons_flex_96_tiprack_1000ul",
        definitionUri="opentrons/opentrons_flex_96_tiprack_1000ul/1",
        displayName="Opentrons Flex 96 Tip Rack 1000 µL",
        # fixme(mm, 2021-11-11): We should smoke-test that the engine picks up labware
        # offsets, but it's unclear to me what the best way of doing that is, since
        # we don't have access to the engine here to add offsets to it.
        offsetId=None,
    )

    assert expected_pipette in pipettes_result
    assert expected_labware in labware_result
    expected_command = commands.PickUpTip.model_construct(
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
        notes=[],
        result=commands.PickUpTipResult(
            tipVolume=1000.0,
            tipLength=85.94999999999999,
            tipDiameter=5.47,
            position=DeckPoint(x=14.38, y=395.38, z=99.0),
        ),
        commandAnnotationIds=[],
    )
    assert expected_command in commands_result
    await subject.finish()


async def test_runner_with_python_and_run_time_parameters(
    python_protocol_file_with_run_time_params: Path,
) -> None:
    """It should run a Python protocol on the PythonAndLegacyRunner."""
    protocol_reader = ProtocolReader()
    protocol_source = await protocol_reader.read_saved(
        files=[python_protocol_file_with_run_time_params],
        directory=None,
    )

    subject = await create_simulating_orchestrator(
        robot_type="OT-3 Standard", protocol_config=protocol_source.config
    )
    result = await subject.run(
        deck_configuration=[],
        protocol_source=protocol_source,
        run_time_param_values={"aspirate_volume": 40.2},
    )
    commands_result = await subject.get_all_commands()
    pipettes_result = result.state_summary.pipettes
    tiprack_result = result.state_summary.labware

    pipette_id_captor = matchers.Captor()
    tiprack_id_captor = matchers.Captor()
    reservoir_id_captor = matchers.Captor()

    expected_pipette = LoadedPipette.model_construct(
        id=pipette_id_captor,
        pipetteName=PipetteNameType.P1000_SINGLE_FLEX,
        mount=MountType.LEFT,
    )

    expected_tiprack = LoadedLabware.model_construct(
        id=tiprack_id_captor,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
        loadName="opentrons_flex_96_tiprack_1000ul",
        definitionUri="opentrons/opentrons_flex_96_tiprack_1000ul/1",
        # fixme(mm, 2021-11-11): We should smoke-test that the engine picks up labware
        # offsets, but it's unclear to me what the best way of doing that is, since
        # we don't have access to the engine here to add offsets to it.
        offsetId=None,
    )

    expected_reservoir = LoadedLabware.model_construct(
        id=reservoir_id_captor,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A2),
        loadName="nest_1_reservoir_195ml",
        definitionUri="opentrons/nest_1_reservoir_195ml/2",
        # fixme(mm, 2021-11-11): We should smoke-test that the engine picks up labware
        # offsets, but it's unclear to me what the best way of doing that is, since
        # we don't have access to the engine here to add offsets to it.
        offsetId=None,
    )

    assert expected_pipette in pipettes_result
    assert expected_tiprack in tiprack_result
    assert expected_reservoir in tiprack_result

    assert result.state_summary.status == EngineStatus.SUCCEEDED

    expected_command = commands.Aspirate.model_construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=commands.AspirateParams.model_construct(
            labwareId=reservoir_id_captor.value,
            wellName=matchers.IsA(str),
            wellLocation=matchers.Anything(),
            flowRate=matchers.IsA(float),
            volume=40.2,
            pipetteId=pipette_id_captor.value,
        ),
        notes=[],
        result=matchers.Anything(),
        commandAnnotationIds=[],
    )

    assert expected_command in commands_result
    await subject.finish()
