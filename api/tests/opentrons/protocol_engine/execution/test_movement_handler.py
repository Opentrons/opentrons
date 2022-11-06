"""Pipetting command subject."""
import pytest
from decoy import Decoy
from typing import NamedTuple

from opentrons.types import MountType, Mount, Point, DeckSlotName
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import (
    CriticalPoint,
    Axis as HardwareAxis,
    MustHomeError as HardwareMustHomeError,
)
from opentrons.motion_planning import Waypoint

from opentrons.protocol_engine.errors import MustHomeError

from opentrons.protocol_engine.types import (
    DeckPoint,
    MotorAxis,
    MovementAxis,
    WellLocation,
    WellOrigin,
    WellOffset,
    DeckSlotLocation,
)
from opentrons.protocol_engine.state import (
    StateStore,
    PipetteLocationData,
    CurrentWell,
    HardwarePipette,
)
from opentrons.protocol_engine.execution import heater_shaker_movement_flagger
from opentrons.protocol_engine.execution.movement import (
    MovementHandler,
    MoveRelativeData,
    SavedPositionData,
)
from opentrons.protocol_engine.execution.thermocycler_movement_flagger import (
    ThermocyclerMovementFlagger,
)

from .mock_defs import MockPipettes


@pytest.fixture(autouse=True)
def mock_raise_heater_shaker_movement_restriction(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock out raise heater-shaker movement restriction."""
    mock_raise = decoy.mock(
        func=heater_shaker_movement_flagger.raise_if_movement_restricted
    )
    monkeypatch.setattr(
        heater_shaker_movement_flagger, "raise_if_movement_restricted", mock_raise
    )


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mock in the shape of a HardwareAPI."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def mock_hw_pipettes(hardware_api: HardwareAPI) -> MockPipettes:
    """Get mock pipette configs and attach them to the mock HW controller."""
    mock_hw_pipettes = MockPipettes()
    hardware_api.attached_instruments = mock_hw_pipettes.by_mount  # type: ignore[misc]
    return mock_hw_pipettes


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def thermocycler_movement_flagger(decoy: Decoy) -> ThermocyclerMovementFlagger:
    """Get a mock in the shape of a ThermocyclerMovementFlagger."""
    return decoy.mock(cls=ThermocyclerMovementFlagger)


@pytest.fixture
def subject(
    state_store: StateStore,
    hardware_api: HardwareAPI,
    thermocycler_movement_flagger: ThermocyclerMovementFlagger,
) -> MovementHandler:
    """Create a PipettingHandler with its dependencies mocked out."""
    return MovementHandler(
        state_store=state_store,
        hardware_api=hardware_api,
        thermocycler_movement_flagger=thermocycler_movement_flagger,
    )


async def test_move_to_well(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    thermocycler_movement_flagger: ThermocyclerMovementFlagger,
    mock_hw_pipettes: MockPipettes,
    subject: MovementHandler,
) -> None:
    """Move requests should call hardware controller with movement data."""
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM,
        offset=WellOffset(x=0, y=0, z=1),
    )
    decoy.when(state_store.labware.get_location(labware_id="labware-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )
    decoy.when(
        state_store.modules.get_heater_shaker_movement_restrictors()
    ).then_return([])

    decoy.when(state_store.geometry.get_ancestor_slot_name("labware-id")).then_return(
        DeckSlotName.SLOT_1
    )

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(mount=Mount.LEFT, config=mock_hw_pipettes.left_config)
    )

    decoy.when(state_store.labware.is_tiprack("labware-id")).then_return(False)

    decoy.when(
        state_store.motion.get_pipette_location(
            pipette_id="pipette-id",
            current_well=None,
        )
    ).then_return(
        PipetteLocationData(
            mount=MountType.LEFT,
            critical_point=CriticalPoint.FRONT_NOZZLE,
        )
    )

    decoy.when(
        await hardware_api.gantry_position(
            mount=Mount.LEFT,
            critical_point=CriticalPoint.FRONT_NOZZLE,
        )
    ).then_return(Point(1, 1, 1))

    decoy.when(hardware_api.get_instrument_max_height(mount=Mount.LEFT)).then_return(
        42.0
    )

    decoy.when(
        state_store.motion.get_movement_waypoints_to_well(
            origin=Point(1, 1, 1),
            origin_cp=CriticalPoint.FRONT_NOZZLE,
            max_travel_z=42.0,
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="B2",
            well_location=well_location,
            current_well=None,
        )
    ).then_return(
        [Waypoint(Point(1, 2, 3), CriticalPoint.XY_CENTER), Waypoint(Point(4, 5, 6))]
    )

    await subject.move_to_well(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B2",
        well_location=well_location,
    )

    decoy.verify(
        await thermocycler_movement_flagger.raise_if_labware_in_non_open_thermocycler(
            labware_parent=DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
        ),
        heater_shaker_movement_flagger.raise_if_movement_restricted(
            hs_movement_restrictors=[],
            destination_slot=1,
            is_multi_channel=False,
            destination_is_tip_rack=False,
        ),
        await hardware_api.move_to(
            mount=Mount.LEFT,
            abs_position=Point(1, 2, 3),
            critical_point=CriticalPoint.XY_CENTER,
        ),
        await hardware_api.move_to(
            mount=Mount.LEFT,
            abs_position=Point(4, 5, 6),
            critical_point=None,
        ),
    )


async def test_move_to_well_from_starting_location(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    thermocycler_movement_flagger: ThermocyclerMovementFlagger,
    mock_hw_pipettes: MockPipettes,
    subject: MovementHandler,
) -> None:
    """It should be able to move to a well from a start location."""
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM,
        offset=WellOffset(x=0, y=0, z=1),
    )

    current_well = CurrentWell(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B2",
    )
    decoy.when(state_store.labware.get_location(labware_id="labware-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )
    decoy.when(
        state_store.modules.get_heater_shaker_movement_restrictors()
    ).then_return([])

    decoy.when(state_store.geometry.get_ancestor_slot_name("labware-id")).then_return(
        DeckSlotName.SLOT_1
    )

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(mount=Mount.LEFT, config=mock_hw_pipettes.left_config)
    )

    decoy.when(state_store.labware.is_tiprack("labware-id")).then_return(False)

    decoy.when(
        state_store.motion.get_pipette_location(
            pipette_id="pipette-id",
            current_well=current_well,
        )
    ).then_return(
        PipetteLocationData(
            mount=MountType.RIGHT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    )

    decoy.when(
        await hardware_api.gantry_position(
            mount=Mount.RIGHT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    ).then_return(Point(1, 2, 5))

    decoy.when(hardware_api.get_instrument_max_height(mount=Mount.RIGHT)).then_return(
        42.0
    )

    decoy.when(
        state_store.motion.get_movement_waypoints_to_well(
            current_well=current_well,
            origin=Point(1, 2, 5),
            origin_cp=CriticalPoint.XY_CENTER,
            max_travel_z=42.0,
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="B2",
            well_location=well_location,
        )
    ).then_return([Waypoint(Point(1, 2, 3), CriticalPoint.XY_CENTER)])

    await subject.move_to_well(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B2",
        well_location=well_location,
        current_well=current_well,
    )

    decoy.verify(
        await thermocycler_movement_flagger.raise_if_labware_in_non_open_thermocycler(
            labware_parent=DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
        ),
        heater_shaker_movement_flagger.raise_if_movement_restricted(
            hs_movement_restrictors=[],
            destination_slot=1,
            is_multi_channel=False,
            destination_is_tip_rack=False,
        ),
        await hardware_api.move_to(
            mount=Mount.RIGHT,
            abs_position=Point(1, 2, 3),
            critical_point=CriticalPoint.XY_CENTER,
        ),
    )


class MoveRelativeSpec(NamedTuple):
    """Test data for move_relative."""

    axis: MovementAxis
    expected_delta: Point
    distance: float = 42.0


@pytest.mark.parametrize(
    MoveRelativeSpec._fields,
    [
        MoveRelativeSpec(
            axis=MovementAxis.X,
            expected_delta=Point(x=42.0, y=0, z=0),
        ),
        MoveRelativeSpec(
            axis=MovementAxis.Y,
            expected_delta=Point(x=0, y=42.0, z=0),
        ),
        MoveRelativeSpec(
            axis=MovementAxis.Z,
            expected_delta=Point(x=0, y=0, z=42.0),
        ),
    ],
)
async def test_move_relative(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    subject: MovementHandler,
    axis: MovementAxis,
    expected_delta: Point,
    distance: float,
) -> None:
    """Test that move_relative triggers a relative move with the HardwareAPI."""
    decoy.when(
        state_store.motion.get_pipette_location(pipette_id="pipette-id")
    ).then_return(
        PipetteLocationData(
            mount=MountType.LEFT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    )

    # TODO(mc, 2022-05-13): the order of these calls is difficult to manage
    # and test for. Ideally, `hardware.move_rel` would return the resulting position
    decoy.when(
        await hardware_api.gantry_position(
            mount=Mount.LEFT,
            critical_point=CriticalPoint.XY_CENTER,
            fail_on_not_homed=True,
        )
    ).then_return(Point(x=1, y=2, z=3))

    result = await subject.move_relative(
        pipette_id="pipette-id",
        axis=axis,
        distance=distance,
    )

    assert result == MoveRelativeData(position=DeckPoint(x=1, y=2, z=3))

    decoy.verify(
        await hardware_api.move_rel(
            mount=Mount.LEFT,
            delta=expected_delta,
            fail_on_not_homed=True,
        )
    )


async def test_move_relative_must_home(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    subject: MovementHandler,
) -> None:
    """It should raise a MustHomeError if the hardware controller is not homed."""
    decoy.when(
        state_store.motion.get_pipette_location(pipette_id="pipette-id")
    ).then_return(
        PipetteLocationData(
            mount=MountType.LEFT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    )

    decoy.when(
        await hardware_api.move_rel(
            mount=Mount.LEFT,
            delta=Point(x=0, y=0, z=42.0),
            fail_on_not_homed=True,
        )
    ).then_raise(HardwareMustHomeError("oh no"))

    with pytest.raises(MustHomeError, match="oh no"):
        await subject.move_relative(
            pipette_id="pipette-id",
            axis=MovementAxis.Z,
            distance=42.0,
        )


async def test_save_position(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    subject: MovementHandler,
) -> None:
    """Test that `save_position` fetches gantry position from hardwareAPI."""
    decoy.when(
        state_store.motion.get_pipette_location(
            pipette_id="pipette-id",
        )
    ).then_return(
        PipetteLocationData(
            mount=MountType.LEFT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    )

    decoy.when(
        await hardware_api.gantry_position(
            mount=Mount.LEFT,
            critical_point=CriticalPoint.XY_CENTER,
            fail_on_not_homed=True,
        )
    ).then_return(Point(1, 1, 1))

    result = await subject.save_position(pipette_id="pipette-id", position_id="123")

    assert result == SavedPositionData(
        positionId="123", position=DeckPoint(x=1, y=1, z=1)
    )


@pytest.mark.parametrize(
    argnames=["unverified_cp", "tip_length", "verified_cp"],
    argvalues=[
        [None, 0, CriticalPoint.NOZZLE],
        [None, 999, CriticalPoint.TIP],
        [CriticalPoint.XY_CENTER, 999, CriticalPoint.XY_CENTER],
    ],
)
async def test_save_position_different_cp(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    subject: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    unverified_cp: CriticalPoint,
    tip_length: float,
    verified_cp: CriticalPoint,
) -> None:
    """Test that `save_position` selects correct critical point."""
    decoy.when(
        state_store.motion.get_pipette_location(
            pipette_id="pipette-id",
        )
    ).then_return(
        PipetteLocationData(
            mount=MountType.LEFT,
            critical_point=unverified_cp,
        )
    )

    mock_hw_pipettes.left_config.update({"tip_length": tip_length})

    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(mount=Mount.LEFT, config=mock_hw_pipettes.left_config)
    )
    decoy.when(
        await hardware_api.gantry_position(
            mount=Mount.LEFT,
            critical_point=verified_cp,
            fail_on_not_homed=True,
        )
    ).then_return(Point(1, 1, 1))

    result = await subject.save_position(pipette_id="pipette-id", position_id="123")

    assert result == SavedPositionData(
        positionId="123", position=DeckPoint(x=1, y=1, z=1)
    )


async def test_save_position_must_home(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    subject: MovementHandler,
) -> None:
    """It should propagate a must home error."""
    decoy.when(
        state_store.motion.get_pipette_location(
            pipette_id="pipette-id",
        )
    ).then_return(
        PipetteLocationData(
            mount=MountType.LEFT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    )

    decoy.when(
        await hardware_api.gantry_position(
            mount=Mount.LEFT,
            critical_point=CriticalPoint.XY_CENTER,
            fail_on_not_homed=True,
        )
    ).then_raise(HardwareMustHomeError("oh no"))

    with pytest.raises(MustHomeError, match="oh no"):
        await subject.save_position(pipette_id="pipette-id", position_id="123")


async def test_move_to_coordinates(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    subject: MovementHandler,
) -> None:
    """Test that move_to_coordinates correctly calls api.move_to."""
    mount = Mount.RIGHT

    current_position = Point(4.44, 5.55, 6.66)
    destination_deck = DeckPoint(x=1.11, y=2.22, z=3.33)
    destination_point = Point(1.11, 2.22, 3.33)

    planned_waypoint_1 = Waypoint(position=Point(3, 1, 4), critical_point=None)
    planned_waypoint_2 = Waypoint(
        position=Point(1, 5, 9), critical_point=CriticalPoint.XY_CENTER
    )

    decoy.when(
        state_store.motion.get_pipette_location(
            pipette_id="pipette-id",
        )
    ).then_return(
        PipetteLocationData(
            mount=MountType.RIGHT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    )

    decoy.when(
        await hardware_api.gantry_position(mount=mount, critical_point=None)
    ).then_return(current_position)

    decoy.when(
        hardware_api.get_instrument_max_height(mount=mount, critical_point=None)
    ).then_return(5678)

    decoy.when(
        state_store.motion.get_movement_waypoints_to_coords(
            origin=current_position,
            dest=destination_point,
            max_travel_z=5678,
            direct=True,
            additional_min_travel_z=1234,
        )
    ).then_return([planned_waypoint_1, planned_waypoint_2])

    await subject.move_to_coordinates(
        pipette_id="pipette-id",
        deck_coordinates=destination_deck,
        direct=True,
        additional_min_travel_z=1234,
    )

    decoy.verify(
        await hardware_api.move_to(
            mount=mount,
            abs_position=planned_waypoint_1.position,
            critical_point=planned_waypoint_1.critical_point,
        ),
        await hardware_api.move_to(
            mount=mount,
            abs_position=planned_waypoint_2.position,
            critical_point=planned_waypoint_2.critical_point,
        ),
    )


async def test_home(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: MovementHandler,
) -> None:
    """It should home a set of axes."""
    await subject.home(
        axes=[
            MotorAxis.X,
            MotorAxis.Y,
            MotorAxis.LEFT_Z,
            MotorAxis.RIGHT_Z,
            MotorAxis.LEFT_PLUNGER,
            MotorAxis.RIGHT_PLUNGER,
        ]
    )
    decoy.verify(
        await hardware_api.home(
            axes=[
                HardwareAxis.X,
                HardwareAxis.Y,
                HardwareAxis.Z,
                HardwareAxis.A,
                HardwareAxis.B,
                HardwareAxis.C,
            ]
        ),
        times=1,
    )

    await subject.home(axes=None)
    decoy.verify(await hardware_api.home(axes=None), times=1)

    await subject.home(axes=[])
    decoy.verify(await hardware_api.home(axes=[]), times=1)
