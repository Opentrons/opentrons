"""Test file for command validations."""

import pytest
from decoy import Decoy

from opentrons.hardware_control.protocols.types import FlexRobotType
from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware


@pytest.mark.ot3_only
def test_ensure_ot3_hardware(decoy: Decoy) -> None:
    """Should return a OT-3 hardware api."""
    try:
        # TODO (tz, 9-23-22) Figure out a better way to run this test with OT-3 api only.
        from opentrons.hardware_control.ot3api import OT3API

        ot_3_hardware_api = decoy.mock(cls=OT3API)
        decoy.when(ot_3_hardware_api.get_robot_type()).then_return(FlexRobotType)
        result = ensure_ot3_hardware(
            ot_3_hardware_api,
        )
        assert result == ot_3_hardware_api
    except ImportError:
        pass
