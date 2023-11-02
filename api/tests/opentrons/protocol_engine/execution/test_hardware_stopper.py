"""Test hardware stopping execution and side effects."""
from __future__ import annotations

import pytest
from decoy import Decoy
from typing import TYPE_CHECKING

from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import OT3Mount
from opentrons.types import PipetteNotAttachedError as HwPipetteNotAttachedError

from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.execution import (
    MovementHandler,
    TipHandler,
    HardwareStopper,
)
from opentrons.protocol_engine.types import MotorAxis, TipGeometry, PostRunHardwareState

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mocked out StateStore instance."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mocked out HardwareAPI instance."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def movement(decoy: Decoy) -> MovementHandler:
    """Get a mocked out MovementHandler."""
    return decoy.mock(cls=MovementHandler)


@pytest.fixture
def mock_tip_handler(decoy: Decoy) -> TipHandler:
    """Get a mocked out TipHandler."""
    return decoy.mock(cls=TipHandler)


@pytest.fixture
def subject(
    hardware_api: HardwareAPI,
    state_store: StateStore,
    movement: MovementHandler,
    mock_tip_handler: TipHandler,
) -> HardwareStopper:
    """Get a HardwareStopper test subject with its dependencies mocked out."""
    return HardwareStopper(
        hardware_api=hardware_api,
        state_store=state_store,
        movement=movement,
        tip_handler=mock_tip_handler,
    )


async def test_hardware_halt(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: HardwareStopper,
) -> None:
    """It should halt the hardware API."""
    await subject.do_halt()

    decoy.verify(await hardware_api.halt(disengage_before_stopping=False))


@pytest.mark.parametrize(
    argnames=["post_run_hardware_state", "expected_home_after"],
    argvalues=[
        (PostRunHardwareState.STAY_ENGAGED_IN_PLACE, False),
        (PostRunHardwareState.DISENGAGE_IN_PLACE, False),
        (PostRunHardwareState.HOME_AND_STAY_ENGAGED, True),
        (PostRunHardwareState.HOME_THEN_DISENGAGE, True),
    ],
)
async def test_hardware_stopping_sequence(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement: MovementHandler,
    mock_tip_handler: TipHandler,
    subject: HardwareStopper,
    post_run_hardware_state: PostRunHardwareState,
    expected_home_after: bool,
) -> None:
    """It should stop the hardware, home the robot and perform drop tip if required."""
    decoy.when(state_store.pipettes.get_all_attached_tips()).then_return(
        [
            ("pipette-id", TipGeometry(length=1.0, volume=2.0, diameter=3.0)),
        ]
    )
    # TODO add branching test logic for OT version?

    await subject.do_stop_and_recover(
        drop_tips_after_run=True,
        post_run_hardware_state=post_run_hardware_state,
    )

    decoy.verify(
        await hardware_api.stop(home_after=False),
        await movement.home(
            axes=[MotorAxis.X, MotorAxis.Y, MotorAxis.LEFT_Z, MotorAxis.RIGHT_Z]
        ),
        await mock_tip_handler.add_tip(
            pipette_id="pipette-id",
            tip=TipGeometry(length=1.0, volume=2.0, diameter=3.0),
        ),
        await movement.move_to_well(
            pipette_id="pipette-id",
            labware_id="fixedTrash",
            well_name="A1",
        ),
        await mock_tip_handler.drop_tip(pipette_id="pipette-id", home_after=False),
        await hardware_api.stop(home_after=expected_home_after),
    )


async def test_hardware_stopping_sequence_without_pipette_tips(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    state_store: StateStore,
    subject: HardwareStopper,
) -> None:
    """Don't drop tip when there aren't any tips attached to pipettes."""
    decoy.when(state_store.pipettes.get_all_attached_tips()).then_return([])

    await subject.do_stop_and_recover(
        drop_tips_after_run=True,
        post_run_hardware_state=PostRunHardwareState.HOME_AND_STAY_ENGAGED,
    )

    decoy.verify(
        await hardware_api.stop(home_after=True),
    )


async def test_hardware_stopping_sequence_no_tip_drop(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    mock_tip_handler: TipHandler,
    subject: HardwareStopper,
) -> None:
    """Don't drop tip when told not to, even if tips are attached."""
    decoy.when(state_store.pipettes.get_all_attached_tips()).then_return(
        [
            ("pipette-id", TipGeometry(length=1.0, volume=2.0, diameter=3.0)),
        ]
    )

    await subject.do_stop_and_recover(
        drop_tips_after_run=False,
        post_run_hardware_state=PostRunHardwareState.DISENGAGE_IN_PLACE,
    )

    decoy.verify(await hardware_api.stop(home_after=False), times=1)

    decoy.verify(
        await mock_tip_handler.add_tip(
            pipette_id="pipette-id",
            tip=TipGeometry(length=1.0, volume=2.0, diameter=3.0),
        ),
        times=0,
    )


async def test_hardware_stopping_sequence_no_pipette(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    mock_tip_handler: TipHandler,
    subject: HardwareStopper,
) -> None:
    """It should gracefully no-op if the HW API reports no attached pipette."""
    decoy.when(state_store.pipettes.get_all_attached_tips()).then_return(
        [
            ("pipette-id", TipGeometry(length=1.0, volume=2.0, diameter=3.0)),
        ]
    )

    decoy.when(
        await mock_tip_handler.add_tip(
            pipette_id="pipette-id",
            tip=TipGeometry(length=1.0, volume=2.0, diameter=3.0),
        ),
    ).then_raise(HwPipetteNotAttachedError("oh no"))

    await subject.do_stop_and_recover(
        drop_tips_after_run=True,
        post_run_hardware_state=PostRunHardwareState.HOME_AND_STAY_ENGAGED,
    )

    decoy.verify(
        await hardware_api.stop(home_after=True),
        times=1,
    )


@pytest.mark.ot3_only
async def test_hardware_stopping_sequence_with_gripper(
    decoy: Decoy,
    state_store: StateStore,
    ot3_hardware_api: OT3API,
    movement: MovementHandler,
    mock_tip_handler: TipHandler,
) -> None:
    """It should stop the hardware, home the robot and perform drop tip if required."""
    subject = HardwareStopper(
        hardware_api=ot3_hardware_api,
        state_store=state_store,
        movement=movement,
        tip_handler=mock_tip_handler,
    )
    decoy.when(state_store.pipettes.get_all_attached_tips()).then_return(
        [
            ("pipette-id", TipGeometry(length=1.0, volume=2.0, diameter=3.0)),
        ]
    )
    decoy.when(state_store.config.use_virtual_gripper).then_return(False)
    decoy.when(ot3_hardware_api.has_gripper()).then_return(True)
    await subject.do_stop_and_recover(
        drop_tips_after_run=True,
        post_run_hardware_state=PostRunHardwareState.HOME_AND_STAY_ENGAGED,
    )

    decoy.verify(
        await ot3_hardware_api.stop(home_after=False),
        await ot3_hardware_api.home_z(mount=OT3Mount.GRIPPER),
        await movement.home(
            axes=[MotorAxis.X, MotorAxis.Y, MotorAxis.LEFT_Z, MotorAxis.RIGHT_Z]
        ),
        await mock_tip_handler.add_tip(
            pipette_id="pipette-id",
            tip=TipGeometry(length=1.0, volume=2.0, diameter=3.0),
        ),
        await movement.move_to_well(
            pipette_id="pipette-id",
            labware_id="fixedTrash",
            well_name="A1",
        ),
        await mock_tip_handler.drop_tip(
            pipette_id="pipette-id",
            home_after=False,
        ),
        await ot3_hardware_api.stop(home_after=True),
    )
