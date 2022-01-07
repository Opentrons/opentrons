"""A simple script to create a motion plan."""
import logging

from opentrons_hardware.hardware_control.motion_planning import move_manager
from opentrons_hardware.hardware_control.motion_planning.types import (
    Axis,
    AxisConstraints,
    SystemConstraints,
    MoveTarget,
    Coordinates,
)


log = logging.getLogger(__name__)

LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "stream_handler": {
            "class": "logging.StreamHandler",
            "formatter": "basic",
            "level": logging.INFO,
        },
    },
    "loggers": {
        "": {
            "handlers": ["stream_handler"],
            "level": logging.INFO,
        },
    },
}


def main() -> None:
    """Entry point."""
    constraints: SystemConstraints = {
        Axis.X: AxisConstraints.build(
            max_acceleration=10000,
            max_speed_discont=40,
            max_direction_change_speed_discont=20,
        ),
        Axis.Y: AxisConstraints.build(
            max_acceleration=10000,
            max_speed_discont=40,
            max_direction_change_speed_discont=20,
        ),
        Axis.Z: AxisConstraints.build(
            max_acceleration=10000,
            max_speed_discont=40,
            max_direction_change_speed_discont=20,
        ),
        Axis.A: AxisConstraints.build(
            max_acceleration=10000,
            max_speed_discont=40,
            max_direction_change_speed_discont=20,
        ),
    }

    target_list = [
        MoveTarget.build(Coordinates(100, 100, 0, 0), 400),
        MoveTarget.build(Coordinates(200, 0, 0, 0), 200),
        MoveTarget.build(Coordinates(300, 0, 0, 0), 400),
        MoveTarget.build(Coordinates(200, 0, 0, 0), 400),
    ]

    origin = Coordinates(0, 0, 0, 0)
    manager = move_manager.MoveManager(constraints=constraints)
    manager.plan_motion(origin=origin, target_list=target_list)


if __name__ == "__main__":
    main()
