"""Pipetting execution handler."""
import pytest
from decoy import Decoy

from opentrons.types import Mount, MountType, Point
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import CriticalPoint

from opentrons.protocol_engine import (
    WellLocation,
    WellOffset,
)
from opentrons.protocol_engine.types import CurrentWell
from opentrons.protocol_engine.state import (
    StateStore,
    HardwarePipette,
    PipetteLocationData,
)
from opentrons.protocol_engine.execution.movement import MovementHandler
from opentrons.protocol_engine.execution.pipetting import (
    HardwarePipettingHandler,
    create_pipette_handler,
    VirtualPipettingHandler,
)
from opentrons.protocol_engine.resources import LabwareDataProvider

from .mock_defs import MockPipettes


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mock in the shape of a HardwareAPI."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def movement_handler(decoy: Decoy) -> MovementHandler:
    """Get a mock in the shape of a MovementHandler."""
    return decoy.mock(cls=MovementHandler)


@pytest.fixture
def labware_data_provider(decoy: Decoy) -> LabwareDataProvider:
    """Get a mock LabwareDataProvider."""
    return decoy.mock(cls=LabwareDataProvider)


@pytest.fixture
def mock_hw_pipettes(hardware_api: HardwareAPI) -> MockPipettes:
    """Get mock pipette configs and attach them to the mock HW controller."""
    mock_hw_pipettes = MockPipettes()
    hardware_api.attached_instruments = mock_hw_pipettes.by_mount  # type: ignore[misc]

    return mock_hw_pipettes


async def test_create_pipette_handler(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    labware_data_provider: LabwareDataProvider,
) -> None:
    """It should return virtual or real tip handlers depending on config."""
    decoy.when(state_store.config.use_virtual_pipettes).then_return(False)
    assert isinstance(
        create_pipette_handler(
            state_store=state_store,
            hardware_api=hardware_api,
            movement_handler=movement_handler,
        ),
        HardwarePipettingHandler,
    )

    decoy.when(state_store.config.use_virtual_pipettes).then_return(True)
    assert isinstance(
        create_pipette_handler(
            state_store=state_store,
            hardware_api=hardware_api,
            movement_handler=movement_handler,
        ),
        VirtualPipettingHandler,
    )


async def test_handle_get_is_ready_to_aspirate_with_state(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    labware_data_provider: LabwareDataProvider,
) -> None:
    """It should find the pipette by ID and use it to dispense."""
    subject = HardwarePipettingHandler(
        state_store=state_store,
        hardware_api=hardware_api,
        movement_handler=movement_handler,
        labware_data_provider=labware_data_provider,
    )

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(
            mount=Mount.RIGHT,
            config=mock_hw_pipettes.right_config,
        )
    )

    decoy.when(state_store.pipettes.get_aspirated_volume("pipette-id")).then_return(0)

    assert subject.get_is_ready_to_aspirate("pipette-id") is True


async def test_handle_get_is_ready_to_aspirate_not_ready_with_state(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    labware_data_provider: LabwareDataProvider,
) -> None:
    """It should find the pipette by ID and use it to dispense."""
    subject = HardwarePipettingHandler(
        state_store=state_store,
        hardware_api=hardware_api,
        movement_handler=movement_handler,
        labware_data_provider=labware_data_provider,
    )

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(
            mount=Mount.RIGHT,
            config=mock_hw_pipettes.right_config,
        )
    )

    decoy.when(state_store.pipettes.get_aspirated_volume("pipette-id")).then_return(
        None
    )

    assert subject.get_is_ready_to_aspirate("pipette-id") is False


async def test_handle_get_is_ready_to_aspirate_with_config(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    labware_data_provider: LabwareDataProvider,
) -> None:
    """It should find the pipette by ID and use it to dispense."""
    subject = HardwarePipettingHandler(
        state_store=state_store,
        hardware_api=hardware_api,
        movement_handler=movement_handler,
        labware_data_provider=labware_data_provider,
    )

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(
            mount=Mount.LEFT,
            config=mock_hw_pipettes.left_config,
        )
    )

    decoy.when(state_store.pipettes.get_aspirated_volume("pipette-id")).then_return(
        None
    )

    assert subject.get_is_ready_to_aspirate("pipette-id") is True


async def test_handle_get_is_ready_to_aspirate_not_ready_with_config(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    labware_data_provider: LabwareDataProvider,
) -> None:
    """It should find the pipette by ID and use it to dispense."""
    subject = HardwarePipettingHandler(
        state_store=state_store,
        hardware_api=hardware_api,
        movement_handler=movement_handler,
        labware_data_provider=labware_data_provider,
    )

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(
            mount=Mount.RIGHT,
            config=mock_hw_pipettes.right_config,
        )
    )

    decoy.when(state_store.pipettes.get_aspirated_volume("pipette-id")).then_return(
        None
    )

    assert subject.get_is_ready_to_aspirate("pipette-id") is False


async def test_handle_dispense_in_place_request(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    labware_data_provider: LabwareDataProvider,
) -> None:
    """It should find the pipette by ID and use it to dispense."""
    subject = HardwarePipettingHandler(
        state_store=state_store,
        hardware_api=hardware_api,
        movement_handler=movement_handler,
        labware_data_provider=labware_data_provider,
    )

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(
            mount=Mount.RIGHT,
            config=mock_hw_pipettes.right_config,
        )
    )

    volume = await subject.dispense_in_place(
        pipette_id="pipette-id",
        volume=25,
        flow_rate=2.5,
    )

    assert volume == 25

    decoy.verify(
        hardware_api.set_flow_rate(
            mount=Mount.RIGHT, aspirate=None, dispense=2.5, blow_out=None
        ),
        await hardware_api.dispense(mount=Mount.RIGHT, volume=25),
        hardware_api.set_flow_rate(
            mount=Mount.RIGHT, aspirate=1.23, dispense=1.23, blow_out=1.23
        ),
    )


async def test_touch_tip(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    labware_data_provider: LabwareDataProvider,
) -> None:
    """It should be able to touch tip to the edges of a well."""
    subject = HardwarePipettingHandler(
        state_store=state_store,
        hardware_api=hardware_api,
        movement_handler=movement_handler,
        labware_data_provider=labware_data_provider,
    )

    decoy.when(
        state_store.motion.get_pipette_location(
            pipette_id="pipette-id",
            current_well=CurrentWell(
                pipette_id="pipette-id",
                labware_id="labware-id",
                well_name="A3",
            ),
        )
    ).then_return(
        PipetteLocationData(
            mount=MountType.LEFT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    )

    decoy.when(
        state_store.geometry.get_touch_points(
            labware_id="labware-id",
            well_name="A3",
            well_location=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
            mount=MountType.LEFT,
            radius=1.23,
        )
    ).then_return([Point(x=11, y=22, z=33), Point(x=44, y=55, z=66)])

    decoy.when(
        state_store.pipettes.get_movement_speed(
            pipette_id="pipette-id", requested_speed=987
        )
    ).then_return(9001)

    await subject.touch_tip(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="A3",
        well_location=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
        radius=1.23,
        speed=987,
    )

    decoy.verify(
        await movement_handler.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="A3",
            well_location=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
        ),
        await hardware_api.move_to(
            mount=Mount.LEFT,
            critical_point=CriticalPoint.XY_CENTER,
            abs_position=Point(x=11, y=22, z=33),
            speed=9001,
        ),
        await hardware_api.move_to(
            mount=Mount.LEFT,
            critical_point=CriticalPoint.XY_CENTER,
            abs_position=Point(x=44, y=55, z=66),
            speed=9001,
        ),
    )


async def test_aspirate_in_place(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    labware_data_provider: LabwareDataProvider,
    mock_hw_pipettes: MockPipettes,
    movement_handler: MovementHandler,
) -> None:
    """Should set flow_rate and call hardware_api aspirate."""
    subject = HardwarePipettingHandler(
        state_store=state_store,
        hardware_api=hardware_api,
        movement_handler=movement_handler,
        labware_data_provider=labware_data_provider,
    )

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(mount=Mount.LEFT, config=mock_hw_pipettes.left_config)
    )

    await subject.aspirate_in_place(pipette_id="pipette-id", volume=25, flow_rate=2.5)

    decoy.verify(
        hardware_api.set_flow_rate(
            mount=Mount.LEFT, aspirate=2.5, dispense=None, blow_out=None
        ),
        await hardware_api.aspirate(mount=Mount.LEFT, volume=25),
        hardware_api.set_flow_rate(
            mount=Mount.LEFT, aspirate=1.23, dispense=1.23, blow_out=1.23
        ),
    )


async def test_blow_out_in_place(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    labware_data_provider: LabwareDataProvider,
    mock_hw_pipettes: MockPipettes,
    movement_handler: MovementHandler,
) -> None:
    """Should set flow_rate and call hardware_api blow-out."""
    subject = HardwarePipettingHandler(
        state_store=state_store,
        hardware_api=hardware_api,
        movement_handler=movement_handler,
        labware_data_provider=labware_data_provider,
    )

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(mount=Mount.LEFT, config=mock_hw_pipettes.left_config)
    )

    await subject.blow_out_in_place(pipette_id="pipette-id", flow_rate=2.5)

    decoy.verify(
        hardware_api.set_flow_rate(
            mount=Mount.LEFT, aspirate=None, dispense=None, blow_out=2.5
        ),
        await hardware_api.blow_out(mount=Mount.LEFT),
        hardware_api.set_flow_rate(
            mount=Mount.LEFT, aspirate=1.23, dispense=1.23, blow_out=1.23
        ),
    )


def test_get_is_ready_to_aspirate_virtual(
    decoy: Decoy, state_store: StateStore
) -> None:
    """Should check if pipette is ready to aspirate."""
    subject = VirtualPipettingHandler(state_store=state_store)

    decoy.when(
        state_store.pipettes.get_aspirated_volume(pipette_id="pipette-id")
    ).then_return(None)

    assert subject.get_is_ready_to_aspirate(pipette_id="pipette-id") is False

    decoy.when(
        state_store.pipettes.get_aspirated_volume(pipette_id="pipette-id")
    ).then_return(0)

    assert subject.get_is_ready_to_aspirate(pipette_id="pipette-id") is True


async def test_aspirate_in_place_virtual(decoy: Decoy, state_store: StateStore) -> None:
    """Should return the volume."""
    subject = VirtualPipettingHandler(state_store=state_store)

    result = await subject.aspirate_in_place(
        pipette_id="pipette-id", volume=3, flow_rate=5
    )
    assert result == 3


async def test_dispense_in_place_virtual(decoy: Decoy, state_store: StateStore) -> None:
    """Should return the volume."""
    subject = VirtualPipettingHandler(state_store=state_store)

    result = await subject.dispense_in_place(
        pipette_id="pipette-id", volume=3, flow_rate=5
    )
    assert result == 3
