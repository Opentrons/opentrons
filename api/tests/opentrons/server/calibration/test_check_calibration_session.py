from unittest.mock import MagicMock
import pytest
from opentrons import types
from opentrons.hardware_control import Pipette

from opentrons.server.endpoints.calibration.session import CheckCalibrationSession


@pytest.fixture
def check_calibration_session(hardware) -> CheckCalibrationSession:
    hardware._attached_instruments[types.Mount.LEFT] = \
        Pipette(model='p10_single_v1', pipette_id='fake10pip',
                inst_offset_config={'single': (0, 0, 0), 'multi': (0, 0, 0)})
    hardware._attached_instruments[types.Mount.RIGHT] = \
        Pipette(model='p300_single_v1', pipette_id='fake300pip',
                inst_offset_config={'single': (0, 0, 0), 'multi': (0, 0, 0)})
    return CheckCalibrationSession(hardware)


def test_initial_state(check_calibration_session):
    assert check_calibration_session.current_state.name == 'sessionStarted'

def test_initial_state(check_calibration_session):
    assert check_calibration_session.current_state.name == 'sessionStarted'
