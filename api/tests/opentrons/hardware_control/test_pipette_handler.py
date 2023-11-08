"""Tests for the HardwareApi class."""
import pytest

from decoy import Decoy
from typing import Optional, Tuple, Dict, List

from opentrons import types
from opentrons.hardware_control.types import OT3Mount, Axis
from opentrons.hardware_control.instruments.ot2.pipette import Pipette
from opentrons.hardware_control.instruments.ot2.pipette_handler import (
    PipetteHandlerProvider,
)
from opentrons.hardware_control.instruments.ot3.pipette import Pipette as OT3Pipette
from opentrons.hardware_control.instruments.ot3.pipette_handler import (
    OT3PipetteHandler,
    TipActionMoveSpec,
)


@pytest.fixture
def mock_pipette(decoy: Decoy) -> Pipette:
    return decoy.mock(cls=Pipette)


@pytest.fixture
def mock_pipette_ot3(decoy: Decoy) -> OT3Pipette:
    return decoy.mock(cls=OT3Pipette)


@pytest.fixture
def mock_pipettes_ot3(decoy: Decoy) -> Tuple[OT3Pipette, OT3Pipette]:
    return (decoy.mock(cls=OT3Pipette), decoy.mock(cls=OT3Pipette))


@pytest.fixture
def subject(decoy: Decoy, mock_pipette: Pipette) -> PipetteHandlerProvider:
    inst_by_mount = {types.Mount.LEFT: mock_pipette, types.Mount.RIGHT: None}
    subject = PipetteHandlerProvider(attached_instruments=inst_by_mount)
    return subject


@pytest.fixture
def subject_ot3(decoy: Decoy, mock_pipette_ot3: OT3Pipette) -> OT3PipetteHandler:
    inst_by_mount = {OT3Mount.LEFT: mock_pipette_ot3, OT3Mount.RIGHT: None}
    subject = OT3PipetteHandler(attached_instruments=inst_by_mount)
    return subject


@pytest.fixture
def mock_presses_list() -> List[TipActionMoveSpec]:
    return [
        TipActionMoveSpec(
            distance=-10.0,
            speed=5.5,
            currents={Axis.Z_L: 1.0},
        ),
        TipActionMoveSpec(
            distance=10.0,
            speed=5.5,
            currents=None,
        ),
        TipActionMoveSpec(
            distance=-11.0,
            speed=5.5,
            currents={Axis.Z_L: 1.0},
        ),
        TipActionMoveSpec(
            distance=11.0,
            speed=5.5,
            currents=None,
        ),
    ]


@pytest.fixture
def mock_pickup_list() -> List[TipActionMoveSpec]:
    return [
        TipActionMoveSpec(
            distance=19.0,
            speed=10,
            currents={Axis.P_L: 1.0, Axis.Q: 1.0},
        ),
        TipActionMoveSpec(
            distance=29,
            speed=5.5,
            currents={Axis.P_L: 1.0, Axis.Q: 1.0},
        ),
    ]


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
    decoy.when(mock_pipette.pick_up_configurations.distance).then_return(0)
    decoy.when(mock_pipette.pick_up_configurations.increment).then_return(0)
    decoy.when(mock_pipette.connect_tiprack_distance_mm).then_return(8)
    decoy.when(mock_pipette.end_tip_action_retract_distance_mm).then_return(2)

    if presses_input is None:
        decoy.when(mock_pipette.pick_up_configurations.presses).then_return(
            expected_array_length
        )

    spec, _add_tip_to_instrs = subject.plan_check_pick_up_tip(
        mount, tip_length, presses, increment
    )

    assert len(spec.presses) == expected_array_length


@pytest.mark.parametrize(
    "presses_input, expected_array_length, channels, expected_pick_up_motor_actions",
    [
        (0, 2, 96, "mock_pickup_list"),
        (None, 4, 8, "mock_presses_list"),
        (2, 4, 1, "mock_presses_list"),
    ],
)
def test_plan_check_pick_up_tip_with_presses_argument_ot3(
    decoy: Decoy,
    subject_ot3: PipetteHandlerProvider,
    mock_pipette_ot3: OT3Pipette,
    presses_input: int,
    expected_array_length: int,
    channels: int,
    expected_pick_up_motor_actions: Optional[List[TipActionMoveSpec]],
    request,
) -> None:
    """Should return an array with expected length."""
    mount = OT3Mount.LEFT
    presses = presses_input
    increment = 1

    decoy.when(mock_pipette_ot3.has_tip).then_return(False)
    decoy.when(mock_pipette_ot3.pick_up_configurations.presses).then_return(2)
    decoy.when(mock_pipette_ot3.pick_up_configurations.increment).then_return(increment)
    decoy.when(mock_pipette_ot3.pick_up_configurations.speed).then_return(5.5)
    decoy.when(mock_pipette_ot3.pick_up_configurations.distance).then_return(10)
    decoy.when(
        mock_pipette_ot3.nozzle_manager.get_tip_configuration_current()
    ).then_return(1)
    decoy.when(mock_pipette_ot3.plunger_motor_current.run).then_return(1)
    decoy.when(mock_pipette_ot3.config.quirks).then_return([])
    decoy.when(mock_pipette_ot3.channels).then_return(channels)
    decoy.when(mock_pipette_ot3.pick_up_configurations.prep_move_distance).then_return(
        19.0
    )
    decoy.when(mock_pipette_ot3.pick_up_configurations.prep_move_speed).then_return(10)
    decoy.when(mock_pipette_ot3.connect_tiprack_distance_mm).then_return(8)
    decoy.when(mock_pipette_ot3.end_tip_action_retract_distance_mm).then_return(2)

    if presses_input is None:
        decoy.when(mock_pipette_ot3.config.pick_up_presses).then_return(
            expected_array_length
        )

    if channels == 96:
        spec = subject_ot3.plan_ht_pick_up_tip()
    else:
        spec = subject_ot3.plan_lt_pick_up_tip(mount, presses, increment)
    assert len(spec.tip_action_moves) == expected_array_length
    assert spec.tip_action_moves == request.getfixturevalue(
        expected_pick_up_motor_actions
    )


def test_get_pipette_fails(decoy: Decoy, subject: PipetteHandlerProvider):
    with pytest.raises(types.PipetteNotAttachedError):
        subject.get_pipette(types.Mount.RIGHT)


@pytest.mark.parametrize(
    "left_offset,right_offset,ok",
    [
        (types.Point(100, 200, 300), None, True),
        (None, types.Point(-100, 200, -500), True),
        (types.Point(100, 200, 300), types.Point(200, 400, 500), False),
    ],
)
def test_ot3_pipette_handler_gives_checks_with_different_pipettes(
    left_offset: Optional[types.Point],
    right_offset: Optional[types.Point],
    ok: bool,
    mock_pipettes_ot3: Tuple[OT3Pipette],
    decoy: Decoy,
) -> None:
    """Should give you reasonable results with one or two pipettes attached."""
    # with a left and not right pipette, we should be able to pass our checks
    inst_by_mount: Dict[OT3Mount, OT3Pipette] = {}
    if left_offset is not None:
        inst_by_mount[OT3Mount.LEFT] = mock_pipettes_ot3[0]
        decoy.when(mock_pipettes_ot3[0].pipette_offset.offset).then_return(left_offset)
    if right_offset is not None:
        inst_by_mount[OT3Mount.RIGHT] = mock_pipettes_ot3[1]
        decoy.when(mock_pipettes_ot3[1].pipette_offset.offset).then_return(right_offset)
    subject = OT3PipetteHandler(attached_instruments=inst_by_mount)
    if left_offset is not None:
        left_result = subject.get_instrument_offset(OT3Mount.LEFT)
        assert left_result.offset == left_offset
        if ok:
            assert left_result.reasonability_check_failures == []
        else:
            assert len(left_result.reasonability_check_failures) == 1
    if right_offset is not None:
        right_result = subject.get_instrument_offset(OT3Mount.RIGHT)
        assert right_result.offset == right_offset
        if ok:
            assert right_result.reasonability_check_failures == []
        else:
            assert len(right_result.reasonability_check_failures) == 1
