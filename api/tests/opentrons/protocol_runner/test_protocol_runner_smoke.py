"""Smoke tests for the ProtocolRunner and ProtocolEngine classes.

These tests construct a ProtocolRunner with a real ProtocolEngine
hooked to a simulating HardwareAPI.

Minimal, but valid and complete, protocol files are then loaded from
disk into the runner, and the protocols are run to completion. From
there, the ProtocolEngine state is inspected to everything was loaded
and ran as expected.
"""


import pytest
from pathlib import Path
from datetime import datetime
from decoy import matchers

from opentrons_shared_data.pipette.dev_types import LabwareUri
from opentrons.types import MountType
from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_api_experimental import DeckSlotName

from opentrons.protocol_engine import (
    ProtocolEngine,
    LabwareData,
    PipetteData,
    PipetteName,
    DeckSlotLocation,
    create_protocol_engine,
    commands,
)

from opentrons.protocol_runner import (
    ProtocolRunner,
    ProtocolFile,
    ProtocolFileType,
)


@pytest.fixture
async def protocol_engine(hardware: HardwareAPI) -> ProtocolEngine:
    """Get a real ProtocolEngine hooked into a simulating HardwareAPI."""
    await hardware.home()
    return await create_protocol_engine(hardware_api=hardware)


@pytest.fixture
async def subject(protocol_engine: ProtocolEngine) -> ProtocolRunner:
    """Get a ProtocolRunner test subject."""
    return ProtocolRunner(protocol_engine=protocol_engine)


async def test_protocol_runner_with_python(
    python_protocol_file: Path,
    protocol_engine: ProtocolEngine,
    subject: ProtocolRunner,
) -> None:
    """It should run a Python protocol on the ProtocolRunner."""
    subject.load(
        ProtocolFile(
            protocol_type=ProtocolFileType.PYTHON,
            files=[python_protocol_file],
        )
    )

    subject.play()
    await subject.join()

    pipette_id_captor = matchers.Captor()
    labware_id_captor = matchers.Captor()

    expected_pipette_entry = (
        pipette_id_captor,
        PipetteData(pipette_name=PipetteName.P300_SINGLE, mount=MountType.LEFT),
    )

    assert (
        expected_pipette_entry in protocol_engine.state_view.pipettes.get_all_pipettes()
    )

    expected_labware_entry = (
        labware_id_captor,
        LabwareData(
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
            uri=LabwareUri("opentrons/opentrons_96_tiprack_300ul/1"),
            calibration=(matchers.IsA(float), matchers.IsA(float), matchers.IsA(float)),
        ),
    )

    assert (
        expected_labware_entry in protocol_engine.state_view.labware.get_all_labware()
    )

    expected_command = commands.PickUpTip.construct(
        id=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        data=commands.PickUpTipData(
            pipetteId=pipette_id_captor.value,
            labwareId=labware_id_captor.value,
            wellName="A1",
        ),
        result=commands.PickUpTipResult(),
    )

    assert expected_command in protocol_engine.state_view.commands.get_all()


async def test_protocol_runner_with_json(
    json_protocol_file: Path,
    protocol_engine: ProtocolEngine,
    subject: ProtocolRunner,
) -> None:
    """It should run a JSON protocol on the ProtocolRunner."""
    subject.load(
        ProtocolFile(
            protocol_type=ProtocolFileType.JSON,
            files=[json_protocol_file],
        )
    )

    subject.play()
    await subject.join()

    expected_pipette_entry = (
        "pipette-id",
        PipetteData(pipette_name=PipetteName.P300_SINGLE, mount=MountType.LEFT),
    )

    assert (
        expected_pipette_entry in protocol_engine.state_view.pipettes.get_all_pipettes()
    )

    expected_labware_entry = (
        "labware-id",
        LabwareData(
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
            uri=LabwareUri("opentrons/opentrons_96_tiprack_300ul/1"),
            calibration=(matchers.IsA(float), matchers.IsA(float), matchers.IsA(float)),
        ),
    )

    assert (
        expected_labware_entry in protocol_engine.state_view.labware.get_all_labware()
    )

    expected_command = commands.PickUpTip.construct(
        id=matchers.IsA(str),
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        data=commands.PickUpTipData(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="A1",
        ),
        result=commands.PickUpTipResult(),
    )

    assert expected_command in protocol_engine.state_view.commands.get_all()
