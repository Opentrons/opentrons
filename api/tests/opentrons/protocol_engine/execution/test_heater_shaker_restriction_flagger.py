"""Tests for heater_shaker_movement_flagger."""


from contextlib import nullcontext as does_not_raise
from typing import Tuple, ContextManager, Any

import pytest
from decoy import Decoy

from opentrons.types import DeckSlotName, Mount
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocol_engine.state import (
    StateStore,
    HardwarePipette,
    HeaterShakerModuleSubState,
    HeaterShakerModuleId,
)
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    ModuleModel as PEModuleModel,
    LoadedModule,
)
from opentrons.protocol_engine.errors import RestrictedPipetteMovementError
from opentrons.protocol_engine.execution.heater_shaker_restriction_flagger import (
    HeaterShakerMovementFlagger,
)

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
) -> HeaterShakerMovementFlagger:
    """Return a movement flagger initialized with mocked-out dependencies."""
    return HeaterShakerMovementFlagger(
        state_store=state_store,
        hardware_api=hardware_api,
    )


@pytest.mark.parametrize(
    argnames=["slot_name", "expected_raise"],
    argvalues=[
        [DeckSlotName.SLOT_4, pytest.raises(RestrictedPipetteMovementError)],  # east
        [DeckSlotName.SLOT_6, pytest.raises(RestrictedPipetteMovementError)],  # west
        [DeckSlotName.SLOT_8, pytest.raises(RestrictedPipetteMovementError)],  # north
        [DeckSlotName.SLOT_2, pytest.raises(RestrictedPipetteMovementError)],  # south
        [DeckSlotName.SLOT_5, pytest.raises(RestrictedPipetteMovementError)],  # h/s
        [DeckSlotName.SLOT_1, does_not_raise()],  # non-adjacent
    ],
)
async def test_raises_when_shaking_on_restricted_movement(
    slot_name: DeckSlotName,
    expected_raise: ContextManager[Any],
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    mock_hw_pipettes: MockPipettes,
    decoy: Decoy,
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted while module is shaking."""
    decoy.when(state_store.modules.get_all()).then_return(
        [
            LoadedModule(
                id="module-id",
                model=PEModuleModel.HEATER_SHAKER_MODULE_V1,
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
                serialNumber="serial-number",
            )
        ]
    )

    decoy.when(
        state_store.modules.get_heater_shaker_module_substate("module-id")
    ).then_return(
        HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            is_labware_latch_closed=False,
            is_plate_shaking=True,
            plate_target_temperature=None,
        )
    )

    decoy.when(state_store.geometry.get_ancestor_slot_name("labware-id")).then_return(
        slot_name
    )

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(mount=Mount.LEFT, config=mock_hw_pipettes.left_config)
    )

    with expected_raise:
        await subject.raise_if_movement_restricted(
            labware_id="labware-id", pipette_id="pipette-id"
        )


@pytest.mark.parametrize(
    argnames=["slot_name", "expected_raise"],
    argvalues=[
        [DeckSlotName.SLOT_4, pytest.raises(RestrictedPipetteMovementError)],  # east
        [DeckSlotName.SLOT_6, pytest.raises(RestrictedPipetteMovementError)],  # west
        [DeckSlotName.SLOT_5, pytest.raises(RestrictedPipetteMovementError)],  # h/s
        [DeckSlotName.SLOT_8, does_not_raise()],  # north
        [DeckSlotName.SLOT_2, does_not_raise()],  # south
        [DeckSlotName.SLOT_3, does_not_raise()],  # non-adjacent
    ],
)
async def test_raises_when_latch_open_on_restricted_movement(
    slot_name: DeckSlotName,
    expected_raise: ContextManager[Any],
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    mock_hw_pipettes: MockPipettes,
    decoy: Decoy,
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted while latch is open."""
    decoy.when(state_store.modules.get_all()).then_return(
        [
            LoadedModule(
                id="module-id",
                model=PEModuleModel.HEATER_SHAKER_MODULE_V1,
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
                serialNumber="serial-number",
            )
        ]
    )

    decoy.when(
        state_store.modules.get_heater_shaker_module_substate("module-id")
    ).then_return(
        HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            is_labware_latch_closed=False,
            is_plate_shaking=False,
            plate_target_temperature=None,
        )
    )

    decoy.when(state_store.geometry.get_ancestor_slot_name("labware-id")).then_return(
        slot_name
    )

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(mount=Mount.LEFT, config=mock_hw_pipettes.left_config)
    )

    with expected_raise:
        await subject.raise_if_movement_restricted(
            labware_id="labware-id", pipette_id="pipette-id"
        )


@pytest.mark.parametrize(
    argnames=["slot_name", "is_tiprack", "expected_raise"],
    argvalues=[
        [
            DeckSlotName.SLOT_4,
            False,
            pytest.raises(RestrictedPipetteMovementError),
        ],  # east
        [
            DeckSlotName.SLOT_6,
            False,
            pytest.raises(RestrictedPipetteMovementError),
        ],  # west
        [
            DeckSlotName.SLOT_8,
            False,
            pytest.raises(RestrictedPipetteMovementError),
        ],  # north, non-tiprack
        [
            DeckSlotName.SLOT_2,
            False,
            pytest.raises(RestrictedPipetteMovementError),
        ],  # south, non-tiprack
        [DeckSlotName.SLOT_8, True, does_not_raise()],  # north, tiprack
        [DeckSlotName.SLOT_2, True, does_not_raise()],  # south, tiprack
        [DeckSlotName.SLOT_5, False, does_not_raise()],  # h/s
        [DeckSlotName.SLOT_7, False, does_not_raise()],  # non-adjacent
    ],
)
async def test_raises_multi_channel_on_restricted_movement(
    slot_name: DeckSlotName,
    is_tiprack: bool,
    expected_raise: ContextManager[Any],
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    mock_hw_pipettes: MockPipettes,
    decoy: Decoy,
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted with a multi-channel pipette."""
    decoy.when(state_store.modules.get_all()).then_return(
        [
            LoadedModule(
                id="module-id",
                model=PEModuleModel.HEATER_SHAKER_MODULE_V1,
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
                serialNumber="serial-number",
            )
        ]
    )

    decoy.when(
        state_store.modules.get_heater_shaker_module_substate("module-id")
    ).then_return(
        HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            is_labware_latch_closed=True,
            is_plate_shaking=False,
            plate_target_temperature=None,
        )
    )

    decoy.when(state_store.geometry.get_ancestor_slot_name("labware-id")).then_return(
        slot_name
    )
    decoy.when(state_store.labware.is_tiprack("labware-id")).then_return(is_tiprack)

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(mount=Mount.RIGHT, config=mock_hw_pipettes.right_config)
    )

    with expected_raise:
        await subject.raise_if_movement_restricted(
            labware_id="labware-id", pipette_id="pipette-id"
        )


@pytest.mark.parametrize(
    argnames=["slot_name"],
    argvalues=[
        [DeckSlotName.SLOT_4],  # east
        [DeckSlotName.SLOT_6],  # west
        [DeckSlotName.SLOT_5],  # h/s
        [DeckSlotName.SLOT_8],  # north
        [DeckSlotName.SLOT_2],  # south
        [DeckSlotName.SLOT_9],  # non-adjacent
    ],
)
async def test_does_not_raise_when_idle_and_latch_closed(
    slot_name: DeckSlotName,
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    mock_hw_pipettes: MockPipettes,
    decoy: Decoy,
) -> None:
    """It should not raise if single channel pipette moves anywhere near heater-shaker when idle and latch closed."""
    decoy.when(state_store.modules.get_all()).then_return(
        [
            LoadedModule(
                id="module-id",
                model=PEModuleModel.HEATER_SHAKER_MODULE_V1,
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
                serialNumber="serial-number",
            )
        ]
    )

    decoy.when(
        state_store.modules.get_heater_shaker_module_substate("module-id")
    ).then_return(
        HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            is_labware_latch_closed=True,
            is_plate_shaking=False,
            plate_target_temperature=None,
        )
    )

    decoy.when(state_store.geometry.get_ancestor_slot_name("labware-id")).then_return(
        slot_name
    )

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(mount=Mount.LEFT, config=mock_hw_pipettes.left_config)
    )

    with does_not_raise():
        await subject.raise_if_movement_restricted(
            labware_id="labware-id", pipette_id="pipette-id"
        )
