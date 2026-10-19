from typing import Generator

import mock
import pytest

from opentrons_shared_data.errors.exceptions import (
    MoveConditionNotMetError,
)

from opentrons.config.types import GantryLoad
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.thread_manager import ThreadManager
from opentrons.hardware_control.types import (
    Axis,
)


@pytest.fixture
def mock_home(ot3_hardware: ThreadManager[OT3API]) -> Generator[mock.Mock, None, None]:
    with mock.patch.object(ot3_hardware._backend, "home") as mock_home:
        mock_home.return_value = {
            Axis.X: 0,
            Axis.Y: 0,
            Axis.Z_L: 0,
            Axis.Z_R: 0,
            Axis.P_L: 0,
            Axis.P_R: 0,
            Axis.Z_G: 0,
            Axis.G: 0,
        }
        yield mock_home


async def test_home(ot3_hardware: ThreadManager[OT3API], mock_home: mock.Mock) -> None:
    with mock.patch("opentrons.hardware_control.ot3api.deck_from_machine") as dfm_mock:
        dfm_mock.return_value = {Axis.X: 20}
        await ot3_hardware._home([Axis.X])
        assert ot3_hardware.gantry_load == GantryLoad.LOW_THROUGHPUT
        mock_home.assert_called_once_with([Axis.X], GantryLoad.LOW_THROUGHPUT)
        assert dfm_mock.call_count == 2
        dfm_mock.assert_called_with(
            machine_pos=mock_home.return_value,
            attitude=ot3_hardware._robot_calibration.deck_calibration.attitude,
            offset=ot3_hardware._robot_calibration.carriage_offset,
            robot_type="OT-3 Standard",
        )
    assert ot3_hardware._current_position[Axis.X] == 20


async def test_home_unmet(
    ot3_hardware: ThreadManager[OT3API], mock_home: mock.Mock
) -> None:
    mock_home.side_effect = MoveConditionNotMetError()
    with pytest.raises(MoveConditionNotMetError):
        await ot3_hardware.home([Axis.X])
    assert ot3_hardware.gantry_load == GantryLoad.LOW_THROUGHPUT
    mock_home.assert_called_once_with([Axis.X], GantryLoad.LOW_THROUGHPUT)
    assert ot3_hardware._current_position == {}
