"""Test legacy custom labware in an end-to-end environment.

Legacy ProtocolContext objects are prohibitively difficult to instansiate
and mock in an isolated unit test environment.
"""
import io
import pytest
import textwrap
from decoy import matchers
from typing import List

from opentrons_shared_data import load_shared_data
from opentrons.types import DeckSlotName
from opentrons.protocol_engine import DeckSlotLocation, LoadedLabware
from opentrons.protocol_reader import ProtocolReader, InputFile
from opentrons.protocol_runner import create_simulating_runner


FIXTURE_LABWARE_DEF = load_shared_data("labware/fixtures/2/fixture_96_plate.json")
CUSTOM_LABWARE_PROTOCOL = textwrap.dedent(
    """
    metadata = {
        "apiLevel": "2.11",
    }

    def run(ctx):
        plate = ctx.load_labware(
            load_name="fixture_96_plate",
            location="1",
        )
    """
).encode()


@pytest.fixture
def custom_labware_protocol_files() -> List[InputFile]:
    """Create input files to feed into the ProtocolReader."""
    return [
        InputFile(
            filename="protocol-name.py",
            file=io.BytesIO(CUSTOM_LABWARE_PROTOCOL),
        ),
        InputFile(filename="labware.json", file=io.BytesIO(FIXTURE_LABWARE_DEF)),
    ]


async def test_legacy_custom_labware(
    protocol_reader: ProtocolReader,
    custom_labware_protocol_files: List[InputFile],
) -> None:
    """It should map legacy pick up tip commands."""
    protocol_source = await protocol_reader.read(
        name="test_protocol",
        files=custom_labware_protocol_files,
    )

    subject = await create_simulating_runner()
    result = await subject.run(protocol_source)

    expected_labware = LoadedLabware.construct(
        id=matchers.Anything(),
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        loadName="fixture_96_plate",
        definitionUri="fixture/fixture_96_plate/1",
        offsetId=None,
    )

    assert result.errors == []
    assert expected_labware in result.labware
