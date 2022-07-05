"""Tests for the InstrumentContext class."""
import pytest

from decoy import Decoy
from opentrons.protocol_api import ProtocolContext

from opentrons.protocol_api.instrument_context import InstrumentContext
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.hardware_control.instruments.pipette import Pipette
# from opentrons.config import pipette_config
# from opentrons.calibration_storage import types as cal_types
from opentrons.types import Mount, Location, Point


@pytest.fixture
def mock_protocol_context(decoy: Decoy) -> ProtocolContext:
    return decoy.mock(cls=ProtocolContext)


@pytest.fixture
def mock_pipette_implementation(decoy: Decoy) -> Pipette:
    return decoy.mock(cls=Pipette)
        # Pipette(
        #     config=pipette_config.load("p10_single_v1"),
        #     pipette_offset_cal=cal_types.PipetteOffsetByPipetteMount(
        #         offset=[0, 0, 0],
        #         source=cal_types.SourceType.user,
        #         status=cal_types.CalibrationStatus(),
        #     ),
        #     pipette_id="test-id",
        # ),
    # )


@pytest.fixture
def subject(decoy: Decoy, mock_pipette_implementation: AbstractInstrument, mock_protocol_context: ProtocolContext) -> InstrumentContext:
    InstrumentContext(implementation=mock_pipette_implementation, ctx=mock_protocol_context)


def test_pick_up_from_location(decoy: Decoy, subject: InstrumentContext) -> None:
    """Should pick up tip from supplied location."""
    # tiprack = mock_protocol_context.load_labware("opentrons_96_tiprack_300ul", 1)
    #
    # decoy.when(mock_protocol_context.load_instrument("p300_single", Mount.LEFT, tip_racks=[tiprack]))
    target = Point(-100, -100, 0)

    subject.pick_up_tip(location=Location(Point(-100, -100, 0), labware="Well"))

    decoy.verify(subject.move_to(target))
