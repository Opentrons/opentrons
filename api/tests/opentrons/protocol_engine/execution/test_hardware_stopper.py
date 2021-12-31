"""Test hardware stopping execution and side effects."""
import pytest
from decoy import Decoy

from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_engine import LoadedPipette, PipetteName, WellLocation
from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.execution import (
    MovementHandler,
    PipettingHandler,
    HardwareStopper,
)
from opentrons.protocol_engine.types import MotorAxis
from opentrons.types import MountType, Mount


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
        pipetting=pipetting
    )


async def test_hardware_stopping_sequence(
        decoy: Decoy,
        subject: HardwareStopper,
        state_store: StateStore,
        hardware_api: HardwareAPI,
        movement: MovementHandler,
        pipetting: PipettingHandler,
) -> None:
    """It should stop the hardware, home the robot and perform drop tip if required."""
    decoy.when(state_store.pipettes.get_attached_tip_labware_by_id()).then_return(
        {"pipette-id": "tiprack-id"})
    decoy.when(state_store.pipettes.get("pipette-id")).then_return(
        LoadedPipette(
            id="pipette-id",
            pipetteName=PipetteName.P300_SINGLE,
            mount=MountType.LEFT,
        )
    )
    decoy.when(state_store.labware.get_tip_length("tiprack-id")).then_return(100)
    await subject.execute_complete_stop()
    decoy.verify(
        await hardware_api.halt(),
        await hardware_api.stop(home_after=False),
        await movement.home(axes=[MotorAxis.X, MotorAxis.Y,
                                  MotorAxis.LEFT_Z, MotorAxis.RIGHT_Z]),
        await hardware_api.add_tip(mount=Mount.LEFT, tip_length=100),
        await pipetting.drop_tip(pipette_id="pipette-id",
                                 labware_id="fixedTrash",
                                 well_name="A1",
                                 well_location=WellLocation()),
        await hardware_api.stop(home_after=True)
    )


async def test_hardware_stopping_sequence_without_pitpette_tips(
        decoy: Decoy,
        subject: HardwareStopper,
        hardware_api: HardwareAPI,
        movement: MovementHandler,
) -> None:
    """Don't drop tip when there aren't any tips attached to pipettes."""
    await subject.execute_complete_stop()
    decoy.verify(
        await hardware_api.halt(),
        await hardware_api.stop(home_after=False),
        await movement.home(axes=[MotorAxis.X, MotorAxis.Y,
                                  MotorAxis.LEFT_Z, MotorAxis.RIGHT_Z]),
        await hardware_api.stop(home_after=True)
    )
