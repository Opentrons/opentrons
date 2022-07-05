"""Tests for the InstrumentContext class."""
import pytest

from decoy import Decoy

from opentrons.protocol_api.instrument_context import InstrumentContext
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.hardware_control.instruments.pipette import Pipette
# from opentrons.config import pipette_config
# from opentrons.calibration_storage import types as cal_types


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
def subject(decoy: Decoy,mock_pipette_implementation: AbstractInstrument) -> InstrumentContext:
    return decoy.mock(cls=InstrumentContext)


def test_pick_up_from_location(subject: InstrumentContext) -> None:
    """Should pick up tip from supplied location."""
