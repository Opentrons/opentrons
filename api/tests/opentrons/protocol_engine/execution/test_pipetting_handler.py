"""Pipetting command handler."""
import pytest
from dataclasses import dataclass, field
from decoy import Decoy
from typing import cast, Dict, Tuple

from opentrons.types import Mount
from opentrons.hardware_control.api import API as HardwareAPI
from opentrons.hardware_control.dev_types import PipetteDict

from opentrons.protocol_engine import DeckLocation, WellLocation, WellOrigin
from opentrons.protocol_engine.state import StateStore, TipGeometry, HardwarePipette
from opentrons.protocol_engine.execution.movement import MovementHandler
from opentrons.protocol_engine.execution.pipetting import PipettingHandler


@dataclass(frozen=True)
class MockPipettes:
    """Dummy pipette data to use in liquid handling collabortation tests."""

    left_config: PipetteDict = field(
        default_factory=lambda: cast(PipetteDict, {"name": "p300_single"})
    )
    right_config: PipetteDict = field(
        default_factory=lambda: cast(PipetteDict, {"name": "p300_multi"})
    )

    @property
    def by_mount(self) -> Dict[Mount, PipetteDict]:
        """Get a mock hw.attached_instruments map."""
        return {Mount.LEFT: self.left_config, Mount.RIGHT: self.right_config}


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
def handler(
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
) -> PipettingHandler:
    """Create a PipettingHandler with its dependencies mocked out."""
    return PipettingHandler(
        state_store=state_store,
        hardware_api=hardware_api,
        movement_handler=movement_handler,
    )


async def test_handle_pick_up_tip_request(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    handler: PipettingHandler,
) -> None:
    """It should handle a PickUpTipRequest properly."""
    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(mount=Mount.LEFT, config=mock_hw_pipettes.left_config)
    )

    decoy.when(
        state_store.geometry.get_tip_geometry(
            labware_id="labware-id",
            well_name="B2",
            pipette_config=mock_hw_pipettes.left_config,
        )
    ).then_return(
        TipGeometry(
            effective_length=50,
            diameter=5,
            volume=300,
        )
    )

    await handler.pick_up_tip(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B2",
    )

    decoy.verify(
        await movement_handler.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="B2",
        ),
        await hardware_api.pick_up_tip(
            mount=Mount.LEFT,
            tip_length=50,
            presses=None,
            increment=None,
        ),
        hardware_api.set_current_tiprack_diameter(mount=Mount.LEFT, tiprack_diameter=5),
        hardware_api.set_working_volume(mount=Mount.LEFT, tip_volume=300),
    )


async def test_handle_drop_up_tip_request(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    handler: PipettingHandler,
) -> None:
    """It should handle a DropTipRequest properly."""
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

    decoy.when(
        state_store.geometry.get_tip_drop_location(
            labware_id="labware-id",
            pipette_config=mock_hw_pipettes.right_config,
        )
    ).then_return(WellLocation(offset=(0, 0, 10)))

    await handler.drop_tip(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="A1",
    )

    decoy.verify(
        await movement_handler.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="A1",
            well_location=WellLocation(offset=(0, 0, 10)),
        ),
        await hardware_api.drop_tip(mount=Mount.RIGHT, home_after=True),
    )


async def test_handle_aspirate_request_without_prep(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    handler: PipettingHandler,
) -> None:
    """It should aspirate from a well if pipette is ready to aspirate."""
    well_location = WellLocation(origin=WellOrigin.BOTTOM, offset=(0, 0, 1))

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

    volume = await handler.aspirate(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="C6",
        well_location=well_location,
        volume=25,
    )

    assert volume == 25

    decoy.verify(
        await movement_handler.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="C6",
            well_location=well_location,
            current_location=None,
        ),
        await hardware_api.aspirate(
            mount=Mount.LEFT,
            volume=25,
        ),
    )


async def test_handle_aspirate_request_with_prep(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    handler: PipettingHandler,
) -> None:
    """It should aspirate from a well if pipette isn't ready to aspirate."""
    well_location = WellLocation(origin=WellOrigin.BOTTOM, offset=(0, 0, 1))

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

    volume = await handler.aspirate(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="C6",
        well_location=well_location,
        volume=25,
    )

    assert volume == 25

    decoy.verify(
        await movement_handler.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="C6",
            well_location=WellLocation(origin=WellOrigin.TOP),
        ),
        await hardware_api.prepare_for_aspirate(mount=Mount.LEFT),
        await movement_handler.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="C6",
            well_location=well_location,
            current_location=DeckLocation(
                pipette_id="pipette-id", labware_id="labware-id", well_name="C6"
            ),
        ),
        await hardware_api.aspirate(mount=Mount.LEFT, volume=25),
    )


async def test_handle_dispense_request(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    movement_handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    handler: PipettingHandler,
) -> None:
    """It should be able to dispense to a well."""
    well_location = WellLocation(origin=WellOrigin.BOTTOM, offset=(0, 0, 1))

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

    volume = await handler.dispense(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="C6",
        well_location=well_location,
        volume=25,
    )

    assert volume == 25

    decoy.verify(
        await movement_handler.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="C6",
            well_location=well_location,
        ),
        await hardware_api.dispense(mount=Mount.RIGHT, volume=25),
    )
