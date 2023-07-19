"""Tests for the HardwareApi class."""
import pytest

from decoy import Decoy
from typing import Optional

from opentrons import types
from opentrons.hardware_control.types import Axis
from opentrons.hardware_control.instruments.ot2.pipette import Pipette
from opentrons.hardware_control.instruments.ot2.pipette_handler import (
    PipetteHandlerProvider,
)
from opentrons.hardware_control.instruments.ot3.pipette import Pipette as OT3Pipette
from opentrons.hardware_control.instruments.ot3.pipette_handler import (
    PipetteHandlerProvider as OT3PipetteHandlerProvider,
    TipMotorPickUpTipSpec,
)


@pytest.fixture
def mock_pipette(decoy: Decoy) -> Pipette:
    return decoy.mock(cls=Pipette)


@pytest.fixture
def mock_pipette_ot3(decoy: Decoy) -> OT3Pipette:
    return decoy.mock(cls=OT3Pipette)


@pytest.fixture
def subject(decoy: Decoy, mock_pipette: Pipette) -> PipetteHandlerProvider:
    inst_by_mount = {types.Mount.LEFT: mock_pipette, types.Mount.RIGHT: None}
    subject = PipetteHandlerProvider(attached_instruments=inst_by_mount)
    return subject


@pytest.fixture
def subject_ot3(
    decoy: Decoy, mock_pipette_ot3: OT3Pipette
) -> OT3PipetteHandlerProvider:
    inst_by_mount = {types.Mount.LEFT: mock_pipette_ot3, types.Mount.RIGHT: None}
    subject = OT3PipetteHandlerProvider(attached_instruments=inst_by_mount)
    return subject


@pytest.mark.parametrize(
    "presses_input, expected_array_length", [(0, 0), (None, 3), (3, 3)]
)
def test_plan_check_pick_up_tip_with_presses_argument(
    decoy: Decoy,
    subject: PipetteHandlerProvider,
    mock_pipette: Pipette,
    presses_input: int,
    expected_array_length: int,
) -> None:
    """Should return an array with expected length."""
    tip_length = 25.0
    mount = types.Mount.LEFT
    presses = presses_input
    increment = None

    decoy.when(mock_pipette.has_tip).then_return(False)
    decoy.when(mock_pipette.config.quirks).then_return([])
    decoy.when(mock_pipette.config.pick_up_distance).then_return(0)
    decoy.when(mock_pipette.config.pick_up_increment).then_return(0)

    if presses_input is None:
        decoy.when(mock_pipette.config.pick_up_presses).then_return(
            expected_array_length
        )

    spec, _add_tip_to_instrs = subject.plan_check_pick_up_tip(
        mount, tip_length, presses, increment
    )

    assert len(spec.presses) == expected_array_length


@pytest.mark.parametrize(
    "presses_input, expected_array_length, channels, expected_pick_up_motor_actions",
    [
        (
            0,
            0,
            96,
            TipMotorPickUpTipSpec(
                tiprack_down=types.Point(0, 0, -7),
                tiprack_up=types.Point(0, 0, 2),
                pick_up_distance=0,
                speed=10,
                currents={Axis.Q: 1},
                home_buffer=10,
            ),
        ),
        (None, 3, 8, None),
        (3, 3, 1, None),
    ],
)
def test_plan_check_pick_up_tip_with_presses_argument_ot3(
    decoy: Decoy,
    subject_ot3: PipetteHandlerProvider,
    mock_pipette_ot3: OT3Pipette,
    presses_input: int,
    expected_array_length: int,
    channels: int,
    expected_pick_up_motor_actions: Optional[TipMotorPickUpTipSpec],
) -> None:
    """Should return an array with expected length."""
    tip_length = 25.0
    mount = types.Mount.LEFT
    presses = presses_input
    increment = 1

    decoy.when(mock_pipette_ot3.has_tip).then_return(False)
    decoy.when(mock_pipette_ot3.pick_up_configurations.presses).then_return(3)
    decoy.when(mock_pipette_ot3.pick_up_configurations.increment).then_return(increment)
    decoy.when(mock_pipette_ot3.pick_up_configurations.speed).then_return(10)
    decoy.when(mock_pipette_ot3.pick_up_configurations.distance).then_return(0)
    decoy.when(mock_pipette_ot3.pick_up_configurations.current).then_return(1)
    decoy.when(mock_pipette_ot3.config.quirks).then_return([])
    decoy.when(mock_pipette_ot3.channels.value).then_return(channels)

    if presses_input is None:
        decoy.when(mock_pipette_ot3.config.pick_up_presses).then_return(
            expected_array_length
        )

    spec, _add_tip_to_instrs = subject_ot3.plan_check_pick_up_tip(
        mount, tip_length, presses, increment
    )

    assert len(spec.presses) == expected_array_length
    assert spec.pick_up_motor_actions == expected_pick_up_motor_actions


def test_get_pipette_fails(decoy: Decoy, subject: PipetteHandlerProvider):
    with pytest.raises(types.PipetteNotAttachedError):
        subject.get_pipette(types.Mount.RIGHT)
