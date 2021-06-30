"""Test running a Python protocol on the ProtocolEngine."""
import pytest
import textwrap
from pathlib import Path
from decoy import matchers

from opentrons_shared_data.pipette.dev_types import LabwareUri
from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_api_experimental import DeckSlotName

from opentrons.protocol_engine import (
    ProtocolEngine,
    LabwareData,
    DeckSlotLocation,
    create_protocol_engine,
)

from opentrons.file_runner import (
    create_file_runner,
    AbstractFileRunner,
    ProtocolFile,
    ProtocolFileType,
)


@pytest.fixture
def python_protocol_file(tmp_path: Path) -> ProtocolFile:
    """Get an on-disk, minimal Python protocol fixture."""
    file_path = tmp_path / "protocol-name.py"
    file_path.write_text(
        textwrap.dedent(
            """
            # my protocol
            metadata = {
                "apiVersion": "3.0",
            }
            def run(ctx):
                ctx.load_labware(
                    load_name="opentrons_96_tiprack_300ul",
                    location="1",
                )
            """
        ),
        encoding="utf-8",
    )

    return ProtocolFile(file_path=file_path, file_type=ProtocolFileType.PYTHON)


@pytest.fixture
async def engine(hardware: HardwareAPI) -> ProtocolEngine:
    """Get a real ProtocolEngine hooked into a simulating HardwareAPI."""
    return await create_protocol_engine(hardware=hardware)


@pytest.fixture
async def subject(
    python_protocol_file: ProtocolFile,
    engine: ProtocolEngine,
) -> AbstractFileRunner:
    """Get a real file runner."""
    return create_file_runner(
        protocol_file=python_protocol_file,
        engine=engine,
    )


async def test_python_protocol_runner(
    engine: ProtocolEngine,
    subject: AbstractFileRunner,
) -> None:
    """It should run a Python protocol on the ProtocolEngine."""
    subject.load()
    await subject.run()

    expected_labware_entry = (
        matchers.IsA(str),
        LabwareData(
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
            uri=LabwareUri("opentrons/opentrons_96_tiprack_300ul/1"),
            calibration=(matchers.IsA(float), matchers.IsA(float), matchers.IsA(float)),
        ),
    )

    assert expected_labware_entry in engine.state_view.labware.get_all_labware()
