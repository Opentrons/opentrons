"""Test gantry movement handler with hardware API."""
import pytest
from decoy import Decoy

from opentrons.types import Mount, Point
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import (
    CriticalPoint,
    Axis as HardwareAxis,
)
from opentrons.hardware_control.errors import MustHomeError as HardwareMustHomeError

from opentrons.motion_planning import Waypoint

from opentrons.protocol_engine.types import MotorAxis
from opentrons.protocol_engine.errors import MustHomeError

from opentrons.protocol_engine.execution.gantry_movement import GantryMovementHandler


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mock in the shape of a HardwareAPI."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def subject(
    hardware_api: HardwareAPI,
) -> GantryMovementHandler:
    """Create a GantryMovementHandler with its dependencies mocked out."""
    return GantryMovementHandler(
        hardware_api=hardware_api,
    )


async def test_get_position(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: GantryMovementHandler,
) -> None:
    """It should get the position of the pipette with the hardware API."""
    decoy.when(
        await hardware_api.gantry_position(
            mount=Mount.RIGHT,
            critical_point=CriticalPoint.XY_CENTER,
            fail_on_not_homed=True,
        )
    ).then_return(Point(1, 2, 3))

    result = await subject.get_position(
        "pipette-id", Mount.RIGHT, CriticalPoint.XY_CENTER, fail_on_not_homed=True
    )

    assert result == Point(1, 2, 3)


async def test_get_position_fail_not_homed(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: GantryMovementHandler,
) -> None:
    """It should get the position of the pipette and set fail_on_not_homed to True."""
    decoy.when(
        await hardware_api.gantry_position(
            mount=Mount.LEFT,
            critical_point=CriticalPoint.NOZZLE,
            fail_on_not_homed=True,
        )
    ).then_return(Point(1, 2, 3))

    result = await subject.get_position_fail_not_homed(
        "pipette-id", Mount.LEFT, CriticalPoint.NOZZLE
    )

    assert result == Point(1, 2, 3)


async def test_get_position_fail_not_homed_raises(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: GantryMovementHandler,
) -> None:
    """It should raise a MustHomeError."""
    decoy.when(
        await hardware_api.gantry_position(
            mount=Mount.LEFT,
            critical_point=CriticalPoint.NOZZLE,
            fail_on_not_homed=True,
        )
    ).then_raise(HardwareMustHomeError("oh no"))

    with pytest.raises(MustHomeError, match="oh no"):
        await subject.get_position_fail_not_homed(
            "pipette-id", Mount.LEFT, CriticalPoint.NOZZLE
        )


def test_get_max_travel_z(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: GantryMovementHandler,
) -> None:
    """It should get the max travel z height with the hardware API."""
    decoy.when(hardware_api.get_instrument_max_height(mount=Mount.RIGHT)).then_return(
        42.1
    )

    assert subject.get_max_travel_z("pipette-id", Mount.RIGHT) == 42.1


async def test_move_to(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: GantryMovementHandler,
) -> None:
    """It should move the gantry with the hardware API."""
    await subject.move_to(
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
    subject: GantryMovementHandler,
) -> None:
    """It should move the gantry by the delta with the hardware API."""
    decoy.when(
        await hardware_api.gantry_position(
            mount=Mount.RIGHT,
            critical_point=CriticalPoint.XY_CENTER,
            fail_on_not_homed=True,
        )
    ).then_return(Point(4, 5, 6))

    result = await subject.move_relative(
        pipette_id="pipette-id",
        mount=Mount.RIGHT,
        critical_point=CriticalPoint.XY_CENTER,
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
    subject: GantryMovementHandler,
) -> None:
    """It should raise a MustHomeError."""
    decoy.when(
        await hardware_api.move_rel(
            mount=Mount.LEFT,
            delta=Point(x=1, y=2, z=3),
            fail_on_not_homed=True,
            speed=456.7,
        )
    ).then_raise(HardwareMustHomeError("oh no"))

    with pytest.raises(MustHomeError, match="oh no"):
        await subject.move_relative(
            pipette_id="pipette-id",
            mount=Mount.LEFT,
            critical_point=None,
            delta=Point(x=1, y=2, z=3),
            speed=456.7,
        )


async def test_home(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: GantryMovementHandler,
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
    decoy.reset()

    await subject.home(axes=None)
    decoy.verify(await hardware_api.home(), times=1)
    decoy.reset()

    await subject.home(axes=[])
    decoy.verify(await hardware_api.home(axes=[]), times=1)


# TODO(mc, 2022-12-01): this is overly complicated
# https://opentrons.atlassian.net/browse/RET-1287
async def test_home_z(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: GantryMovementHandler,
) -> None:
    """It should home a single Z axis and plunger."""
    await subject.home(axes=[MotorAxis.LEFT_Z, MotorAxis.LEFT_PLUNGER])
    decoy.verify(
        await hardware_api.home_z(Mount.LEFT),
        await hardware_api.home_plunger(Mount.LEFT),
    )
    decoy.reset()

    await subject.home(axes=[MotorAxis.RIGHT_Z, MotorAxis.RIGHT_PLUNGER])
    decoy.verify(
        await hardware_api.home_z(Mount.RIGHT),
        await hardware_api.home_plunger(Mount.RIGHT),
    )
    decoy.reset()

    await subject.home(axes=[MotorAxis.LEFT_PLUNGER])
    decoy.verify(
        await hardware_api.home_plunger(Mount.LEFT),
        times=1,
    )
    decoy.reset()

    await subject.home(axes=[MotorAxis.RIGHT_PLUNGER])
    decoy.verify(
        await hardware_api.home_plunger(Mount.RIGHT),
        times=1,
    )
    decoy.reset()

    await subject.home(axes=[MotorAxis.RIGHT_Z, MotorAxis.LEFT_PLUNGER])
    decoy.verify(
        await hardware_api.home([HardwareAxis.A, HardwareAxis.B]),
        times=1,
    )
