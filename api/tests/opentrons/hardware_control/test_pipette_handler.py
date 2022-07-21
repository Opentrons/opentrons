"""Tests for the HardwareApi class."""
import pytest

from decoy import Decoy

from opentrons import types
from opentrons.hardware_control.instruments.pipette import Pipette
from opentrons.hardware_control.instruments.pipette_handler import (
    PipetteHandlerProvider,
)


@pytest.fixture
def mock_pipette(decoy: Decoy) -> Pipette:
    return decoy.mock(cls=Pipette)


@pytest.fixture
def subject(decoy: Decoy, mock_pipette: Pipette) -> PipetteHandlerProvider:
    inst_by_mount = {types.Mount.LEFT: mock_pipette}
    subject = PipetteHandlerProvider(attached_instruments=inst_by_mount)
    return subject


def test_plan_check_pick_up_tip_with_presses_0(
    decoy: Decoy, subject: PipetteHandlerProvider, mock_pipette
) -> None:
    """Should return an array with 0 length."""
    tip_length = 25.0
    mount = types.Mount.LEFT
    presses = 0
    increment = None

    decoy.when(mock_pipette.has_tip).then_return(False)
    decoy.when(mock_pipette.config.quirks).then_return([])
    decoy.when(mock_pipette.config.pick_up_distance).then_return(0)
    decoy.when(mock_pipette.config.pick_up_increment).then_return(0)

    spec, _add_tip_to_instrs = subject.plan_check_pick_up_tip(mount, tip_length, presses, increment)

    assert spec.presses == []
