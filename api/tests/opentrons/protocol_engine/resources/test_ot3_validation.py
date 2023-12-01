"""Test file for command validations."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware
from opentrons.protocol_engine.errors.exceptions import HardwareNotSupportedError

from opentrons.hardware_control.api import API
from opentrons_shared_data.robot.dev_types import RobotTypeEnum


@pytest.mark.ot3_only
def test_ensure_ot3_hardware(decoy: Decoy) -> None:
    """Should return a OT-3 hardware api."""
    try:
        # TODO (tz, 9-23-22) Figure out a better way to run this test with OT-3 api only.
        from opentrons.hardware_control.ot3api import OT3API

        ot_3_hardware_api = decoy.mock(cls=OT3API)
        decoy.when(ot_3_hardware_api.get_robot_type()).then_return(RobotTypeEnum.FLEX)
        result = ensure_ot3_hardware(
            ot_3_hardware_api,
        )
        assert result == ot_3_hardware_api
    except ImportError:
        pass


@pytest.mark.ot3_only
def test_ensure_ot3_hardware_raises_error(decoy: Decoy) -> None:
    """Should raise a HardwareNotSupportedError exception."""
    ot_2_hardware_api = decoy.mock(cls=API)
    decoy.when(ot_2_hardware_api.get_robot_type()).then_return(RobotTypeEnum.OT2)
    with pytest.raises(HardwareNotSupportedError):
        ensure_ot3_hardware(
            ot_2_hardware_api,
        )
