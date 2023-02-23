"""Test gantry movement handler with hardware API."""
import pytest
from decoy import Decoy

from opentrons.types import Mount, MountType, Point
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import (
    CriticalPoint,
    Axis as HardwareAxis,
)
from opentrons.hardware_control.errors import MustHomeError as HardwareMustHomeError

from opentrons.motion_planning import Waypoint

from opentrons.protocol_engine.state import StateView, PipetteLocationData
from opentrons.protocol_engine.types import MotorAxis, DeckPoint, CurrentWell
from opentrons.protocol_engine.errors import MustHomeError

from opentrons.protocol_engine.execution.gantry_movement import (
    HardwareGantryMovementHandler,
    VirtualGantryMovementHandler,
    create_gantry_movement_handler,
)


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mock in the shape of a HardwareAPI."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def state_view(decoy: Decoy) -> StateView:
    """Get a mock in the shape of a StateView."""
    return decoy.mock(cls=StateView)


@pytest.fixture
def hardware_subject(
    hardware_api: HardwareAPI,
    state_view: StateView,
) -> HardwareGantryMovementHandler:
    """Create a GantryMovementHandler with its dependencies mocked out."""
    return HardwareGantryMovementHandler(
        hardware_api=hardware_api,
        state_view=state_view,
    )


@pytest.fixture
def virtual_subject(
    state_view: StateView,
) -> VirtualGantryMovementHandler:
    """Create a GantryMovementHandler with its dependencies mocked out."""
    return VirtualGantryMovementHandler(
        state_view=state_view,
    )


async def test_create_gantry_movement_handler(
    decoy: Decoy,
    state_view: StateView,
    hardware_api: HardwareAPI,
) -> None:
    """It should return virtual or real gantry movement handlers depending on config."""
    decoy.when(state_view.config.use_virtual_pipettes).then_return(False)
    assert isinstance(
        create_gantry_movement_handler(
            state_view=state_view,
            hardware_api=hardware_api,
        ),
        HardwareGantryMovementHandler,
    )

    decoy.when(state_view.config.use_virtual_pipettes).then_return(True)
    assert isinstance(
        create_gantry_movement_handler(
            state_view=state_view,
            hardware_api=hardware_api,
        ),
        VirtualGantryMovementHandler,
    )


async def test_get_position(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    state_view: StateView,
    hardware_subject: HardwareGantryMovementHandler,
) -> None:
    """It should get the position of the pipette with the hardware API."""
    current_well = CurrentWell(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B2",
    )
    decoy.when(
        state_view.motion.get_pipette_location("pipette-id", current_well)
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
            fail_on_not_homed=True,
        )
    ).then_return(Point(1, 2, 3))

    result = await hardware_subject.get_position(
        "pipette-id", current_well=current_well, fail_on_not_homed=True
    )

    assert result == Point(1, 2, 3)


async def test_get_position_raises(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    state_view: StateView,
    hardware_subject: HardwareGantryMovementHandler,
) -> None:
    """It should raise a MustHomeError."""
    decoy.when(state_view.motion.get_pipette_location("pipette-id", None)).then_return(
        PipetteLocationData(
            mount=MountType.LEFT,
            critical_point=CriticalPoint.NOZZLE,
        )
    )
    decoy.when(
        await hardware_api.gantry_position(
            mount=Mount.LEFT,
            critical_point=CriticalPoint.NOZZLE,
            fail_on_not_homed=False,
        )
    ).then_raise(HardwareMustHomeError("oh no"))

    with pytest.raises(MustHomeError, match="oh no"):
        await hardware_subject.get_position("pipette-id")


def test_get_max_travel_z(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    state_view: StateView,
    hardware_subject: HardwareGantryMovementHandler,
) -> None:
    """It should get the max travel z height with the hardware API."""
    decoy.when(state_view.pipettes.get_mount("pipette-id")).then_return(MountType.RIGHT)
    decoy.when(hardware_api.get_instrument_max_height(mount=Mount.RIGHT)).then_return(
        42.1
    )

    assert hardware_subject.get_max_travel_z("pipette-id") == 42.1


async def test_move_to(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    hardware_subject: HardwareGantryMovementHandler,
) -> None:
    """It should move the gantry with the hardware API."""
    await hardware_subject.move_to(
        mount=Mount.RIGHT,
        waypoint=Waypoint(position=Point(1, 2, 3), critical_point=CriticalPoint.TIP),
        speed=9001,
    )

    decoy.verify(
        await hardware_api.move_to(
            mount=Mount.RIGHT,
            abs_position=Point(1, 2, 3),
            critical_point=CriticalPoint.TIP,
            speed=9001,
        )
    )


async def test_move_relative(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    state_view: StateView,
    hardware_subject: HardwareGantryMovementHandler,
) -> None:
    """It should move the gantry by the delta with the hardware API."""
    decoy.when(state_view.motion.get_pipette_location("pipette-id")).then_return(
        PipetteLocationData(
            mount=MountType.RIGHT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    )
    decoy.when(
        await hardware_api.gantry_position(
            mount=Mount.RIGHT,
            critical_point=CriticalPoint.XY_CENTER,
            fail_on_not_homed=True,
        )
    ).then_return(Point(4, 5, 6))

    result = await hardware_subject.move_relative(
        pipette_id="pipette-id",
        delta=Point(1, 2, 3),
        speed=9001,
    )

    assert result == Point(4, 5, 6)

    # TODO(mc, 2022-05-13): the order of these calls is difficult to manage
    # and test for. Ideally, `hardware.move_rel` would return the resulting position
    decoy.verify(
        await hardware_api.move_rel(
            mount=Mount.RIGHT,
            delta=Point(1, 2, 3),
            fail_on_not_homed=True,
            speed=9001,
        ),
        times=1,
    )


async def test_move_relative_must_home(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    state_view: StateView,
    hardware_subject: HardwareGantryMovementHandler,
) -> None:
    """It should raise a MustHomeError."""
    decoy.when(state_view.motion.get_pipette_location("pipette-id")).then_return(
        PipetteLocationData(
            mount=MountType.LEFT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    )
    decoy.when(
        await hardware_api.move_rel(
            mount=Mount.LEFT,
            delta=Point(x=1, y=2, z=3),
            fail_on_not_homed=True,
            speed=456.7,
        )
    ).then_raise(HardwareMustHomeError("oh no"))

    with pytest.raises(MustHomeError, match="oh no"):
        await hardware_subject.move_relative(
            pipette_id="pipette-id",
            delta=Point(x=1, y=2, z=3),
            speed=456.7,
        )


async def test_home(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    hardware_subject: HardwareGantryMovementHandler,
) -> None:
    """It should home a set of axes."""
    await hardware_subject.home(
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
    decoy.reset()

    await hardware_subject.home(axes=None)
    decoy.verify(await hardware_api.home(), times=1)
    decoy.reset()

    await hardware_subject.home(axes=[])
    decoy.verify(await hardware_api.home(axes=[]), times=1)


# TODO(mc, 2022-12-01): this is overly complicated
# https://opentrons.atlassian.net/browse/RET-1287
async def test_home_z(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    hardware_subject: HardwareGantryMovementHandler,
) -> None:
    """It should home a single Z axis and plunger."""
    await hardware_subject.home(axes=[MotorAxis.LEFT_Z, MotorAxis.LEFT_PLUNGER])
    decoy.verify(
        await hardware_api.home_z(Mount.LEFT),
        await hardware_api.home_plunger(Mount.LEFT),
    )
    decoy.reset()

    await hardware_subject.home(axes=[MotorAxis.RIGHT_Z, MotorAxis.RIGHT_PLUNGER])
    decoy.verify(
        await hardware_api.home_z(Mount.RIGHT),
        await hardware_api.home_plunger(Mount.RIGHT),
    )
    decoy.reset()

    await hardware_subject.home(axes=[MotorAxis.LEFT_PLUNGER])
    decoy.verify(
        await hardware_api.home_plunger(Mount.LEFT),
        times=1,
    )
    decoy.reset()

    await hardware_subject.home(axes=[MotorAxis.RIGHT_PLUNGER])
    decoy.verify(
        await hardware_api.home_plunger(Mount.RIGHT),
        times=1,
    )
    decoy.reset()

    await hardware_subject.home(axes=[MotorAxis.RIGHT_Z, MotorAxis.LEFT_PLUNGER])
    decoy.verify(
        await hardware_api.home([HardwareAxis.A, HardwareAxis.B]),
        times=1,
    )


async def test_virtual_get_position(
    decoy: Decoy,
    state_view: StateView,
    virtual_subject: VirtualGantryMovementHandler,
) -> None:
    """It should get the position of the pipette with the state store."""
    decoy.when(state_view.pipettes.get_deck_point("pipette-id")).then_return(
        DeckPoint(x=1, y=2, z=3)
    )

    result = await virtual_subject.get_position("pipette-id")

    assert result == Point(x=1, y=2, z=3)


async def test_virtual_get_position_default(
    decoy: Decoy,
    state_view: StateView,
    virtual_subject: VirtualGantryMovementHandler,
) -> None:
    """It should get a default Point if no stored deck point can be found in the state store."""
    decoy.when(state_view.pipettes.get_deck_point("pipette-id")).then_return(None)

    result = await virtual_subject.get_position("pipette-id")

    assert result == Point(x=0, y=0, z=0)


def test_virtual_get_max_travel_z(
    decoy: Decoy,
    state_view: StateView,
    virtual_subject: VirtualGantryMovementHandler,
) -> None:
    """It should get the max travel z height with the state store."""
    decoy.when(
        state_view.pipettes.get_instrument_max_height_ot2("pipette-id")
    ).then_return(42)
    decoy.when(state_view.tips.get_tip_length("pipette-id")).then_return(20)

    result = virtual_subject.get_max_travel_z("pipette-id")

    assert result == 22.0


async def test_virtual_move_relative(
    decoy: Decoy,
    state_view: StateView,
    virtual_subject: VirtualGantryMovementHandler,
) -> None:
    """It should simulate moving the gantry by the delta with the state store."""
    decoy.when(state_view.pipettes.get_deck_point("pipette-id")).then_return(
        DeckPoint(x=1, y=2, z=3)
    )

    result = await virtual_subject.move_relative(
        "pipette-id",
        delta=Point(3, 2, 1),
        speed=123,
    )

    assert result == Point(x=4, y=4, z=4)
