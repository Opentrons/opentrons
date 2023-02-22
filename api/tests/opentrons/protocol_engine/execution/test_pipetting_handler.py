"""Pipetting execution handler."""
import pytest
from decoy import Decoy
from typing import Tuple

from opentrons.types import Mount, MountType, Point
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import CriticalPoint
from opentrons.hardware_control.dev_types import PipetteDict

from opentrons.protocol_engine import (
    WellLocation,
    WellOrigin,
    WellOffset,
    DeckPoint,
)
from opentrons.protocol_engine.state import (
    StateStore,
    HardwarePipette,
    CurrentWell,
    PipetteLocationData,
)
from opentrons.protocol_engine.execution.movement import MovementHandler
from opentrons.protocol_engine.execution.pipetting import PipettingHandler
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


@pytest.fixture
def mock_left_pipette_config(
    mock_pipette_configs: Tuple[PipetteDict, PipetteDict]
) -> PipetteDict:
    """Get mock pipette config for the left pipette."""
    return mock_pipette_configs[0]


@pytest.fixture
def mock_right_pipette_config(
    mock_pipette_configs: Tuple[PipetteDict, PipetteDict]
) -> PipetteDict:
    """Get mock pipette config for the right pipette."""
    return mock_pipette_configs[1]


@pytest.fixture
def subject(
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    labware_data_provider: LabwareDataProvider,
) -> PipettingHandler:
    """Create a PipettingHandler with its dependencies mocked out."""
    return PipettingHandler(
        state_store=state_store,
        hardware_api=hardware_api,
        movement_handler=movement_handler,
        labware_data_provider=labware_data_provider,
    )


async def test_handle_aspirate_request_without_prep(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    subject: PipettingHandler,
) -> None:
    """It should aspirate from a well if pipette is ready to aspirate."""
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM,
        offset=WellOffset(x=0, y=0, z=1),
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

    decoy.when(
        state_store.pipettes.get_is_ready_to_aspirate(
            pipette_id="pipette-id",
            pipette_config=mock_hw_pipettes.left_config,
        )
    ).then_return(True)

    decoy.when(
        await movement_handler.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="C6",
            well_location=well_location,
            current_well=None,
        ),
    ).then_return(DeckPoint(x=1, y=2, z=3))

    result = await subject.aspirate(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="C6",
        well_location=well_location,
        volume=25,
        flow_rate=2.5,
    )

    assert result.volume == 25
    assert result.position == DeckPoint(x=1, y=2, z=3)

    decoy.verify(
        hardware_api.set_flow_rate(
            mount=Mount.LEFT, aspirate=2.5, dispense=None, blow_out=None
        ),
        await hardware_api.aspirate(
            mount=Mount.LEFT,
            volume=25,
        ),
        hardware_api.set_flow_rate(
            mount=Mount.LEFT, aspirate=1.23, dispense=1.23, blow_out=1.23
        ),
    )


async def test_handle_aspirate_request_with_prep(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    subject: PipettingHandler,
) -> None:
    """It should aspirate from a well if pipette isn't ready to aspirate."""
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM,
        offset=WellOffset(x=0, y=0, z=1),
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

    decoy.when(
        state_store.pipettes.get_is_ready_to_aspirate(
            pipette_id="pipette-id",
            pipette_config=mock_hw_pipettes.left_config,
        )
    ).then_return(False)

    decoy.when(
        await movement_handler.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="C6",
            well_location=well_location,
            current_well=CurrentWell(
                pipette_id="pipette-id",
                labware_id="labware-id",
                well_name="C6",
            ),
        ),
    ).then_return(DeckPoint(x=1, y=2, z=3))

    result = await subject.aspirate(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="C6",
        well_location=well_location,
        volume=25,
        flow_rate=2.5,
    )

    assert result.volume == 25
    assert result.position == DeckPoint(x=1, y=2, z=3)

    decoy.verify(
        await movement_handler.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="C6",
            well_location=WellLocation(origin=WellOrigin.TOP),
        )
    )

    decoy.verify(
        await hardware_api.prepare_for_aspirate(mount=Mount.LEFT),
        hardware_api.set_flow_rate(
            mount=Mount.LEFT, aspirate=2.5, dispense=None, blow_out=None
        ),
        await hardware_api.aspirate(mount=Mount.LEFT, volume=25),
        hardware_api.set_flow_rate(
            mount=Mount.LEFT, aspirate=1.23, dispense=1.23, blow_out=1.23
        ),
    )


async def test_handle_dispense_in_place_request(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    subject: PipettingHandler,
) -> None:
    """It should find the pipette by ID and use it to dispense."""
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
    subject: PipettingHandler,
) -> None:
    """It should be able to touch tip to the edges of a well."""
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
