"""Test hardware stopping execution and side effects."""
from __future__ import annotations

import pytest
from decoy import Decoy
from typing import TYPE_CHECKING

from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import OT3Mount
from opentrons.protocol_engine import WellLocation, errors
from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.execution import (
    MovementHandler,
    PipettingHandler,
    HardwareStopper,
)
from opentrons.protocol_engine.types import MotorAxis

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
def pipetting(decoy: Decoy) -> PipettingHandler:
    """Get a mocked out PipettingHandler."""
    return decoy.mock(cls=PipettingHandler)


@pytest.fixture
def subject(
    hardware_api: HardwareAPI,
    state_store: StateStore,
    movement: MovementHandler,
    pipetting: PipettingHandler,
) -> HardwareStopper:
    """Get a HardwareStopper test subject with its dependencies mocked out."""
    return HardwareStopper(
        hardware_api=hardware_api,
        state_store=state_store,
        movement=movement,
        pipetting=pipetting,
    )


async def test_hardware_halt(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: HardwareStopper,
) -> None:
    """It should halt the hardware API."""
    await subject.do_halt()

    decoy.verify(await hardware_api.halt())


async def test_hardware_stopping_sequence(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    subject: HardwareStopper,
) -> None:
    """It should stop the hardware, home the robot and perform drop tip if required."""
    decoy.when(state_store.pipettes.get_attached_tip_labware_by_id()).then_return(
        {"pipette-id": "tiprack-id"}
    )

    await subject.do_stop_and_recover(drop_tips_and_home=True)

    decoy.verify(
        await hardware_api.stop(home_after=False),
        await movement.home(
            axes=[MotorAxis.X, MotorAxis.Y, MotorAxis.LEFT_Z, MotorAxis.RIGHT_Z]
        ),
        await pipetting.add_tip(
            pipette_id="pipette-id",
            labware_id="tiprack-id",
        ),
        await pipetting.drop_tip(
            pipette_id="pipette-id",
            labware_id="fixedTrash",
            well_name="A1",
            well_location=WellLocation(),
        ),
        await hardware_api.stop(home_after=True),
    )


@pytest.mark.ot3_only
async def test_hardware_stopping_sequence_with_gripper(
    decoy: Decoy,
    state_store: StateStore,
    ot3_hardware_api: OT3API,
    movement: MovementHandler,
    pipetting: PipettingHandler,
) -> None:
    """It should stop the hardware, home the robot and perform drop tip if required."""
    subject = HardwareStopper(
        hardware_api=ot3_hardware_api,
        state_store=state_store,
        movement=movement,
        pipetting=pipetting,
    )
    decoy.when(state_store.pipettes.get_attached_tip_labware_by_id()).then_return(
        {"pipette-id": "tiprack-id"}
    )
    decoy.when(ot3_hardware_api.has_gripper()).then_return(True)
    await subject.do_stop_and_recover(drop_tips_and_home=True)

    decoy.verify(
        await ot3_hardware_api.stop(home_after=False),
        await ot3_hardware_api.home_z(mount=OT3Mount.GRIPPER),
        await movement.home(
            axes=[MotorAxis.X, MotorAxis.Y, MotorAxis.LEFT_Z, MotorAxis.RIGHT_Z]
        ),
        await pipetting.add_tip(
            pipette_id="pipette-id",
            labware_id="tiprack-id",
        ),
        await pipetting.drop_tip(
            pipette_id="pipette-id",
            labware_id="fixedTrash",
            well_name="A1",
            well_location=WellLocation(),
        ),
        await ot3_hardware_api.stop(home_after=True),
    )


async def test_hardware_stopping_sequence_without_pipette_tips(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    state_store: StateStore,
    subject: HardwareStopper,
) -> None:
    """Don't drop tip when there aren't any tips attached to pipettes."""
    decoy.when(state_store.pipettes.get_attached_tip_labware_by_id()).then_return({})

    await subject.do_stop_and_recover(drop_tips_and_home=True)

    decoy.verify(
        await hardware_api.stop(home_after=True),
    )


async def test_hardware_stopping_sequence_no_home(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    subject: HardwareStopper,
) -> None:
    """Don't drop tip when told not to, even if tips are attached."""
    decoy.when(state_store.pipettes.get_attached_tip_labware_by_id()).then_return(
        {"pipette-id": "tiprack-id"}
    )

    await subject.do_stop_and_recover(drop_tips_and_home=False)

    decoy.verify(
        await hardware_api.stop(home_after=False),
    )


async def test_hardware_stopping_sequence_no_pipette(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    pipetting: PipettingHandler,
    subject: HardwareStopper,
) -> None:
    """It should gracefully no-op if the HW API reports no attached pipette."""
    decoy.when(state_store.pipettes.get_attached_tip_labware_by_id()).then_return(
        {"pipette-id": "tiprack-id"}
    )

    decoy.when(
        await pipetting.add_tip(
            pipette_id="pipette-id",
            labware_id="tiprack-id",
        ),
    ).then_raise(errors.PipetteNotAttachedError("oh no"))

    await subject.do_stop_and_recover(drop_tips_and_home=True)

    decoy.verify(
        await hardware_api.stop(home_after=True),
    )


@pytest.mark.ot3_only
async def test_hardware_stopping_sequence_with_gripper(
    decoy: Decoy,
    state_store: StateStore,
    ot3_hardware_api: OT3API,
    movement: MovementHandler,
    pipetting: PipettingHandler,
) -> None:
    """It should stop the hardware, home the robot and perform drop tip if required."""
    subject = HardwareStopper(
        hardware_api=ot3_hardware_api,
        state_store=state_store,
        movement=movement,
        pipetting=pipetting,
    )
    decoy.when(state_store.pipettes.get_attached_tip_labware_by_id()).then_return(
        {"pipette-id": "tiprack-id"}
    )
    decoy.when(ot3_hardware_api.has_gripper()).then_return(True)
    await subject.do_stop_and_recover(drop_tips_and_home=True)

    decoy.verify(
        await ot3_hardware_api.stop(home_after=False),
        await ot3_hardware_api.home_z(mount=OT3Mount.GRIPPER),
        await movement.home(
            axes=[MotorAxis.X, MotorAxis.Y, MotorAxis.LEFT_Z, MotorAxis.RIGHT_Z]
        ),
        await pipetting.add_tip(
            pipette_id="pipette-id",
            labware_id="tiprack-id",
        ),
        await pipetting.drop_tip(
            pipette_id="pipette-id",
            labware_id="fixedTrash",
            well_name="A1",
            well_location=WellLocation(),
        ),
        await ot3_hardware_api.stop(home_after=True),
    )
