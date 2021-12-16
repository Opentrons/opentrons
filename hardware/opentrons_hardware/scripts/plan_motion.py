from opentrons_hardware.hardware_control.motion_planning import move_manager, move_utils
from opentrons_hardware.hardware_control.motion_planning.types import *
import logging

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
    constraints: SystemConstraints = {
        Axis.X: AxisConstraints(
            max_acceleration=10000,
            max_speed_discont=40,
            max_direction_change_speed_discont=20,
        ),
        Axis.Y: AxisConstraints(
            max_acceleration=10000,
            max_speed_discont=40,
            max_direction_change_speed_discont=20,
        ),
        Axis.Z: AxisConstraints(
            max_acceleration=10000,
            max_speed_discont=40,
            max_direction_change_speed_discont=20,
        ),
        Axis.A: AxisConstraints(
            max_acceleration=10000,
            max_speed_discont=40,
            max_direction_change_speed_discont=20,
        ),
    }

    target_list = [
        MoveTarget(Coordinates(100, 0, 0, 0), 400),
        MoveTarget(Coordinates(200, 0, 0, 0), 200),
        MoveTarget(Coordinates(300, 0, 0, 0), 400),
        MoveTarget(Coordinates(200, 0, 0, 0), 400),
    ]

    origin = Coordinates(0, 0, 0, 0)
    manager = move_manager.MoveManager(constraints=constraints, origin=origin, target_list=target_list)
    manager.plan_motion()


if __name__ == "__main__":
    main()
