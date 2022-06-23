"""Tests for heater_shaker_movement_flagger."""


from contextlib import nullcontext as does_not_raise
from typing import Tuple, NamedTuple, ContextManager, Any

import pytest
from decoy import Decoy

from opentrons.types import DeckSlotName, Mount
from opentrons.protocol_engine.state import StateStore, HardwarePipette
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    ModuleModel as PEModuleModel,
    LoadedModule,
)
from opentrons.drivers.types import HeaterShakerLabwareLatchStatus
from opentrons.protocol_engine.errors import HeaterShakerMovementRestrictionError
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.modules import HeaterShaker as HardwareHeaterShaker
from opentrons.hardware_control.modules.types import (
    # Renamed to avoid conflicting with ..types.ModuleModel.
    ModuleType as OpentronsModuleType,
    HeaterShakerModuleModel as OpentronsHeaterShakerModuleModel,
    HeaterShakerStatus,
)
from opentrons.hardware_control.dev_types import PipetteDict

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


class LocationAndHeaterShakerStatus(NamedTuple):
    """Test parametrization data.

    Destination slot name, heater-shaker and latch status, and what
    we expect the subject to raise when it finds
    """

    slot_name: DeckSlotName
    heater_shaker_status: HeaterShakerStatus
    latch_status: HeaterShakerLabwareLatchStatus
    expected_raise_cm: ContextManager[Any]


class MultiChannelLocationAndLabwareStatus(NamedTuple):
    """Test parametrization data.

    Destination slot name, if labware is tiprack, and what
    we expect the subject to raise when it finds
    """

    slot_name: DeckSlotName
    is_tiprack: bool
    expected_raise_cm: ContextManager[Any]


@pytest.mark.parametrize(
    LocationAndHeaterShakerStatus._fields,
    [
        LocationAndHeaterShakerStatus(
            slot_name=DeckSlotName.SLOT_4,
            heater_shaker_status=HeaterShakerStatus.RUNNING,
            latch_status=HeaterShakerLabwareLatchStatus.IDLE_CLOSED,
            expected_raise_cm=pytest.raises(HeaterShakerMovementRestrictionError),
        ),
        LocationAndHeaterShakerStatus(
            slot_name=DeckSlotName.SLOT_2,
            heater_shaker_status=HeaterShakerStatus.RUNNING,
            latch_status=HeaterShakerLabwareLatchStatus.IDLE_CLOSED,
            expected_raise_cm=pytest.raises(HeaterShakerMovementRestrictionError),
        ),
        LocationAndHeaterShakerStatus(
            slot_name=DeckSlotName.SLOT_3,
            heater_shaker_status=HeaterShakerStatus.RUNNING,
            latch_status=HeaterShakerLabwareLatchStatus.IDLE_CLOSED,
            expected_raise_cm=does_not_raise(),
        ),
        LocationAndHeaterShakerStatus(
            slot_name=DeckSlotName.SLOT_5,
            heater_shaker_status=HeaterShakerStatus.IDLE,
            latch_status=HeaterShakerLabwareLatchStatus.IDLE_OPEN,
            expected_raise_cm=pytest.raises(HeaterShakerMovementRestrictionError),
        ),
        LocationAndHeaterShakerStatus(
            slot_name=DeckSlotName.SLOT_6,
            heater_shaker_status=HeaterShakerStatus.IDLE,
            latch_status=HeaterShakerLabwareLatchStatus.IDLE_OPEN,
            expected_raise_cm=pytest.raises(HeaterShakerMovementRestrictionError),
        ),
        LocationAndHeaterShakerStatus(
            slot_name=DeckSlotName.SLOT_8,
            heater_shaker_status=HeaterShakerStatus.IDLE,
            latch_status=HeaterShakerLabwareLatchStatus.IDLE_OPEN,
            expected_raise_cm=does_not_raise(),
        ),
        LocationAndHeaterShakerStatus(
            slot_name=DeckSlotName.SLOT_4,
            heater_shaker_status=HeaterShakerStatus.IDLE,
            latch_status=HeaterShakerLabwareLatchStatus.IDLE_CLOSED,
            expected_raise_cm=does_not_raise(),
        ),
    ],
)
async def test_raises_any_channel_on_restricted_movement(
    slot_name: DeckSlotName,
    heater_shaker_status: HeaterShakerStatus,
    latch_status: HeaterShakerLabwareLatchStatus,
    expected_raise_cm: ContextManager[Any],
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    mock_hw_pipettes: MockPipettes,
    decoy: Decoy,
) -> None:
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

    heater_shaker = decoy.mock(cls=HardwareHeaterShaker)
    decoy.when(heater_shaker.device_info).then_return({"serial": "serial-number"})
    decoy.when(heater_shaker.status).then_return(heater_shaker_status)
    decoy.when(heater_shaker.labware_latch_status).then_return(latch_status)
    decoy.when(
        await hardware_api.find_modules(
            by_model=OpentronsHeaterShakerModuleModel.HEATER_SHAKER_V1,
            resolved_type=OpentronsModuleType.HEATER_SHAKER,
        )
    ).then_return(([heater_shaker], None))

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

    with expected_raise_cm:
        await subject.raise_if_movement_restricted(
            labware_id="labware-id", pipette_id="pipette-id"
        )


@pytest.mark.parametrize(
    MultiChannelLocationAndLabwareStatus._fields,
    [
        MultiChannelLocationAndLabwareStatus(
            slot_name=DeckSlotName.SLOT_4,
            is_tiprack=False,
            expected_raise_cm=pytest.raises(HeaterShakerMovementRestrictionError),
        ),
        MultiChannelLocationAndLabwareStatus(
            slot_name=DeckSlotName.SLOT_8,
            is_tiprack=False,
            expected_raise_cm=pytest.raises(HeaterShakerMovementRestrictionError),
        ),
        MultiChannelLocationAndLabwareStatus(
            slot_name=DeckSlotName.SLOT_2,
            is_tiprack=True,
            expected_raise_cm=does_not_raise(),
        ),
    ],
)
async def test_raises_multi_channel_on_restricted_movement(
    slot_name: DeckSlotName,
    is_tiprack: bool,
    expected_raise_cm: ContextManager[Any],
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    mock_hw_pipettes: MockPipettes,
    decoy: Decoy,
) -> None:
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

    heater_shaker = decoy.mock(cls=HardwareHeaterShaker)
    decoy.when(heater_shaker.device_info).then_return({"serial": "serial-number"})
    decoy.when(heater_shaker.status).then_return(HeaterShakerStatus.IDLE)
    decoy.when(heater_shaker.labware_latch_status).then_return(
        HeaterShakerLabwareLatchStatus.IDLE_CLOSED
    )
    decoy.when(
        await hardware_api.find_modules(
            by_model=OpentronsHeaterShakerModuleModel.HEATER_SHAKER_V1,
            resolved_type=OpentronsModuleType.HEATER_SHAKER,
        )
    ).then_return(([heater_shaker], None))

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

    with expected_raise_cm:
        await subject.raise_if_movement_restricted(
            labware_id="labware-id", pipette_id="pipette-id"
        )
