"""Test hardware stopping execution and side effects."""
import pytest
from decoy import Decoy

from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_engine import WellLocation, errors
from opentrons.protocol_engine.state import StateStore, HardwarePipette, TipGeometry
from opentrons.protocol_engine.execution import (
    MovementHandler,
    PipettingHandler,
    HardwareStopper,
)
from opentrons.protocol_engine.types import MotorAxis
from opentrons.types import Mount

from .mock_defs import MockPipettes


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mocked out StateStore instance."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mocked out HardwareAPI instance."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def mock_hw_pipettes(hardware_api: HardwareAPI) -> MockPipettes:
    """Get mock pipette configs and attach them to the mock HW controller."""
    mock_hw_pipettes = MockPipettes()
    hardware_api.attached_instruments = mock_hw_pipettes.by_mount  # type: ignore[misc]
    return mock_hw_pipettes


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
    subject: HardwareStopper,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    mock_hw_pipettes: MockPipettes,
) -> None:
    """It should stop the hardware, home the robot and perform drop tip if required."""
    decoy.when(state_store.pipettes.get_attached_tip_labware_by_id()).then_return(
        {"pipette-id": "tiprack-id"}
    )
    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id", attached_pipettes=mock_hw_pipettes.by_mount
        )
    ).then_return(
        HardwarePipette(mount=Mount.LEFT, config=mock_hw_pipettes.left_config)
    )
    decoy.when(
        state_store.geometry.get_tip_geometry(
            labware_id="tiprack-id",
            well_name="A1",
            pipette_config=mock_hw_pipettes.left_config,
        )
    ).then_return(
        TipGeometry(
            effective_length=100,
            diameter=5,
            volume=300,
        )
    )

    await subject.do_stop_and_recover(drop_tips_and_home=True)

    decoy.verify(
        await hardware_api.stop(home_after=False),
        await movement.home(
            axes=[MotorAxis.X, MotorAxis.Y, MotorAxis.LEFT_Z, MotorAxis.RIGHT_Z]
        ),
        await hardware_api.add_tip(mount=Mount.LEFT, tip_length=100),
        await pipetting.drop_tip(
            pipette_id="pipette-id",
            labware_id="fixedTrash",
            well_name="A1",
            well_location=WellLocation(),
        ),
        await hardware_api.stop(home_after=True),
    )


async def test_hardware_stopping_sequence_without_pipette_tips(
    decoy: Decoy,
    subject: HardwareStopper,
    hardware_api: HardwareAPI,
    movement: MovementHandler,
    state_store: StateStore,
) -> None:
    """Don't drop tip when there aren't any tips attached to pipettes."""
    decoy.when(state_store.pipettes.get_attached_tip_labware_by_id()).then_return({})

    await subject.do_stop_and_recover(drop_tips_and_home=True)

    decoy.verify(
        await hardware_api.stop(home_after=True),
    )


async def test_hardware_stopping_sequence_no_home(
    decoy: Decoy,
    subject: HardwareStopper,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    mock_hw_pipettes: MockPipettes,
) -> None:
    """Don't drop tip when there aren't any tips attached to pipettes."""
    decoy.when(state_store.pipettes.get_attached_tip_labware_by_id()).then_return(
        {"pipette-id": "tiprack-id"}
    )
    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id", attached_pipettes=mock_hw_pipettes.by_mount
        )
    ).then_return(
        HardwarePipette(mount=Mount.LEFT, config=mock_hw_pipettes.left_config)
    )
    decoy.when(
        state_store.geometry.get_tip_geometry(
            labware_id="tiprack-id",
            well_name="A1",
            pipette_config=mock_hw_pipettes.left_config,
        )
    ).then_return(
        TipGeometry(
            effective_length=100,
            diameter=5,
            volume=300,
        )
    )

    await subject.do_stop_and_recover(drop_tips_and_home=False)

    decoy.verify(
        await hardware_api.stop(home_after=False),
    )


async def test_hardware_stopping_sequence_no_pipette(
    decoy: Decoy,
    subject: HardwareStopper,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    mock_hw_pipettes: MockPipettes,
) -> None:
    """It should gracefully no-op if the HW API reports no attached pipette."""
    decoy.when(state_store.pipettes.get_attached_tip_labware_by_id()).then_return(
        {"pipette-id": "tiprack-id"}
    )

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_raise(errors.PipetteNotAttachedError("oh no"))

    await subject.do_stop_and_recover(drop_tips_and_home=True)

    decoy.verify(
        await hardware_api.stop(home_after=True),
    )
